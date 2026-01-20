import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateHospitalAdminRequest {
  hospital_id: string;
  email: string;
  password: string;
  full_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("=== CREATE HOSPITAL ADMIN START ===");

    // Client with user's auth to verify they are superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller is a superadmin
    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Caller user ID:", callerUser.id);

    // Check if caller has superadmin role
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id);

    if (roleError) {
      console.error("Error checking caller roles:", roleError);
      return new Response(
        JSON.stringify({ error: "Error checking roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = roleData?.map((r) => r.role) || [];
    console.log("Caller roles:", roles);

    if (!roles.includes("superadmin")) {
      console.error("Caller is not a superadmin");
      return new Response(
        JSON.stringify({ error: "Only superadmins can create hospital admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { hospital_id, email, password, full_name }: CreateHospitalAdminRequest = await req.json();
    console.log("Request data:", { hospital_id, email, full_name });

    if (!hospital_id || !email || !password || !full_name) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "hospital_id, email, password, and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client to create user and manage data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // VALIDATION: Check if email already exists
    console.log("Checking if email already exists...");
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar e-mail existente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailExists = existingUsers.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      console.error("Email already in use:", email);
      return new Response(
        JSON.stringify({ error: "Este e-mail já está em uso. Por favor, use outro e-mail." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email is available, proceeding with user creation...");

    // Create user with email confirmed
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", newUser.user.id);

    // Helper function to rollback: delete user and optionally hospital
    const rollback = async (userId: string, deleteHospital: boolean = false) => {
      console.log("Rolling back - deleting user:", userId);
      try {
        await adminClient.auth.admin.deleteUser(userId);
        console.log("User deleted successfully");
      } catch (e) {
        console.error("Failed to delete user during rollback:", e);
      }

      if (deleteHospital) {
        console.log("Rolling back - deleting hospital:", hospital_id);
        try {
          await adminClient.from("hospitals").delete().eq("id", hospital_id);
          console.log("Hospital deleted successfully");
        } catch (e) {
          console.error("Failed to delete hospital during rollback:", e);
        }
      }
    };

    // Update profile with hospital_id and full_name
    // Wait a bit for the trigger to create the profile
    console.log("Waiting for profile trigger...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        hospital_id: hospital_id,
        full_name: full_name,
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      // Try to insert if update fails (profile may not exist yet)
      const { error: insertError } = await adminClient
        .from("profiles")
        .insert({
          id: newUser.user.id,
          hospital_id: hospital_id,
          full_name: full_name,
        });
      
      if (insertError) {
        console.error("Error inserting profile:", insertError);
        await rollback(newUser.user.id, true);
        return new Response(
          JSON.stringify({ error: "Erro ao configurar perfil do administrador. O hospital foi removido. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Profile configured successfully");

    // Add admin role to new user - use ON CONFLICT to avoid duplicate key error
    // Note: There might be a trigger that already adds the role, so we use upsert logic
    const { data: existingRole, error: checkRoleError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", newUser.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (checkRoleError) {
      console.error("Error checking existing role:", checkRoleError);
    }

    if (!existingRole) {
      console.log("Inserting admin role...");
      const { error: roleInsertError } = await adminClient
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: "admin",
        });

      if (roleInsertError) {
        // Check if it's a duplicate key error (role was added by trigger)
        if (roleInsertError.code === "23505") {
          console.log("Role already exists (added by trigger), continuing...");
        } else {
          console.error("Error adding role:", roleInsertError);
          await rollback(newUser.user.id, true);
          return new Response(
            JSON.stringify({ error: "Erro ao configurar permissões do administrador. O hospital foi removido. Tente novamente." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      console.log("Admin role already exists (added by trigger)");
    }

    console.log("=== CREATE HOSPITAL ADMIN SUCCESS ===");
    console.log(`Successfully created admin user ${email} for hospital ${hospital_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email,
          full_name: full_name,
        } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("=== CREATE HOSPITAL ADMIN ERROR ===");
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor. Verifique os logs." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
