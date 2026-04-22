import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaMicrosoft } from "react-icons/fa";

// --- IMPORTACIONES DE FIREBASE CLIENT SDK ---
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  OAuthProvider, // ¡Importa OAuthProvider aquí!
} from "firebase/auth";
// Asegúrate de que la ruta sea correcta y que appleProvider esté exportado
import {
  auth,
  googleProvider,
  microsoftProvider,
  appleProvider,
} from "../firebaseConfig";
// --- FIN IMPORTACIONES DE FIREBASE CLIENT SDK ---

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// Helper function to generate a cryptographically secure random string for nonce
// This is crucial for Apple Sign-in security
function generateRandomString(length: number): string {
  const array = new Uint32Array(length / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    "",
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  // --- MUTACIÓN UNIFICADA PARA ENVIAR ID TOKEN AL BACKEND ---
  const firebaseAuthMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const response = await apiRequest("POST", "/api/login", { idToken });
      return await response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/user"], { user: data.user });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "Login successful." });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      console.error("Backend session establishment error:", error);
      toast({
        title: "Authentication Failed",
        description:
          error.message ||
          "An error occurred during session establishment with our server. Please try again.",
        variant: "destructive",
      });
    },
  });

  // --- LOCAL EMAIL/PASSWORD AUTH ---
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const onLogin = async (data: LoginForm) => {
    setLocalAuthLoading(true);
    try {
      const response = await apiRequest("POST", "/api/local-login", {
        email: data.email,
        password: data.password,
      });
      const result = await response.json();
      queryClient.setQueryData(["/api/auth/user"], { user: result.user });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "Login successful." });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLocalAuthLoading(false);
    }
  };

  const onSignup = async (data: SignupForm) => {
    setLocalAuthLoading(true);
    try {
      const response = await apiRequest("POST", "/api/local-signup", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      const result = await response.json();
      queryClient.setQueryData(["/api/auth/user"], { user: result.user });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "Account created successfully." });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalAuthLoading(false);
    }
  };

  // --- FUNCIONES PARA LOGIN SOCIAL CON FIREBASE ---
  const handleFirebaseSocialLogin = async (provider: any) => {
    try {
      let currentProvider = provider;
      let nonce: string | undefined;

      // Lógica específica para Apple Sign-in: generar y establecer el nonce
      // Comprobamos si el proveedor es el de Apple por su providerId
      if (provider.providerId === "apple.com") {
        // <-- CAMBIO AQUÍ: Comprobar providerId
        nonce = generateRandomString(32); // Genera un string hexadecimal de 32 caracteres (16 bytes)
        currentProvider.setCustomParameters({ nonce }); // Establece el nonce en el proveedor
        // Los scopes 'email' y 'name' ya se establecieron en firebaseConfig.js
        // No es necesario volver a añadirlos aquí a menos que quieras anularlos
      }

      const userCredential = await signInWithPopup(auth, currentProvider);

      // Si es un nuevo usuario de Apple y solicitaste 'name' y 'email',
      // estos estarán disponibles en userCredential.user.displayName y userCredential.user.email
      // o en userCredential.additionalUserInfo.profile por primera vez.

      const idToken = await userCredential.user.getIdToken();
      firebaseAuthMutation.mutate(idToken); // Enviar el ID Token al backend
    } catch (error: any) {
      console.error("Firebase social login error:", error);
      let errorMessage =
        "An unexpected error occurred during social login. Please try again.";

      if (error && typeof error === "object" && "code" in error) {
        const firebaseErrorCode = (error as any).code;
        switch (firebaseErrorCode) {
          case "auth/popup-closed-by-user":
            errorMessage = "Login window closed. Please try again.";
            break;
          case "auth/cancelled-popup-request":
            errorMessage =
              "Another login window is already open. Please complete or close it.";
            break;
          case "auth/account-exists-with-different-credential":
            errorMessage =
              "An account with this email already exists using a different sign-in method. Please login with your existing method.";
            break;
          case "auth/auth-domain-config-required":
            errorMessage =
              "Authentication domain not configured for this provider. Please contact support.";
            break;
          case "auth/operation-not-allowed":
            errorMessage =
              "Sign-in with this provider is not enabled. Please contact support.";
            break;
          default:
            errorMessage = (error as any).message;
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Social Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  // --- FIN DE NUEVAS FUNCIONES ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Your AI Workspace
          </CardTitle>
          <CardDescription>
            {activeTab === "signup"
              ? "Create your account"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Social login buttons */}
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleFirebaseSocialLogin(googleProvider)}
              disabled={firebaseAuthMutation.isPending}
            >
              <FcGoogle size={20} /> Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleFirebaseSocialLogin(appleProvider)}
              //disabled={firebaseAuthMutation.isPending}
              disabled
            >
              <FaApple size={20} /> Continue with Apple
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleFirebaseSocialLogin(microsoftProvider)}
              //disabled={firebaseAuthMutation.isPending}
              disabled
            >
              <FaMicrosoft size={20} /> Continue with Microsoft
            </Button>
          </div>

          <div className="relative my-4">
            <hr />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-sm text-gray-500">
              or
            </span>
          </div>

          {/* Tabs for login/signup */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-3"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@email.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="******"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={localAuthLoading || firebaseAuthMutation.isPending}
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      padding: "16px 12px",
                      color: "white",
                      borderRadius: "12px",
                    }}
                  >
                    {localAuthLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(onSignup)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Doe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@email.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Min. 8 characters"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={localAuthLoading || firebaseAuthMutation.isPending}
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      padding: "16px 12px",
                      color: "white",
                      borderRadius: "12px",
                    }}
                  >
                    {localAuthLoading ? "Creating..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
