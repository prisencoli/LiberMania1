import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, registerSchema, LoginData, RegisterData } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      nickname: '',
    },
  });
  
  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };
  
  return (
    <>
      <Helmet>
        <title>Login or Register - LiberMania</title>
        <meta name="description" content="Join LiberMania, the sustainable book exchange community. Sign up to start sharing and discovering books." />
      </Helmet>
      
      <div className="min-h-screen bg-neutral-light py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Auth Forms Section */}
            <div className="w-full md:w-1/2 lg:w-2/5">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading text-2xl">Welcome Back!</CardTitle>
                      <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your username" 
                                    {...field} 
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
                                    type="password" 
                                    placeholder="Enter your password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <p className="text-sm text-neutral-dark">
                        Don't have an account? 
                        <TabsTrigger value="register" className="underline text-primary ml-1 p-0">
                          Register now
                        </TabsTrigger>
                      </p>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
                      <CardDescription>Join our community and get 50 bonus credits!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Choose a username" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="nickname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="How others will see you" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Create a password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? "Creating account..." : "Register"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <p className="text-sm text-neutral-dark">
                        Already have an account? 
                        <TabsTrigger value="login" className="underline text-primary ml-1 p-0">
                          Login
                        </TabsTrigger>
                      </p>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="w-full md:w-1/2 lg:w-3/5">
              <div className="bg-primary rounded-xl p-8 md:p-12 text-white">
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">Discover a New Way to Share Books</h1>
                <p className="text-lg mb-6 opacity-90">
                  LiberMania is a community-driven platform for book lovers who want to share and discover new reads sustainably.
                </p>
                
                <div className="space-y-6 mt-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">50 Free Credits</h3>
                      <p>Start exchanging right away with your signup bonus</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">No Subscription Fees</h3>
                      <p>Our basic exchange service is completely free</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Thousands of Books</h3>
                      <p>Access a growing library shared by our community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
