import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield, MapPin, Phone, Mail } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import LoginForm from "@/components/auth/LoginForm";
import collegeHero from "@/assets/college-hero.jpg";

const Login = () => {
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image with Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={collegeHero}
          alt="St. Peter's College Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-navy-700/90" />
        
        {/* Content on hero */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <CollegeLogo variant="light" size="lg" />
          
          <div className="space-y-6 animate-fade-up">
            <h1 className="font-serif text-4xl xl:text-5xl font-bold leading-tight">
              Academic Certificate
              <span className="block text-gold-400">Management Portal</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Request, track, and manage your academic certificates online. 
              A seamless digital experience for students and administrators.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              {[
                { icon: "🎓", text: "Transfer Certificates" },
                { icon: "📜", text: "Bonafide Certificates" },
                { icon: "📊", text: "Attendance Records" },
                { icon: "✅", text: "Conduct Certificates" },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-400" />
              <span>St. Peter's College of Engineering and Technology, Avadi, Chennai, Tamil Nadu, India, Pin Code - 600 054</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold-400" />
              <span>044-26558091</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold-400" />
              <span>spcet2008@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <CollegeLogo size="md" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your certificate portal
            </p>
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as "student" | "admin")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-secondary">
              <TabsTrigger 
                value="student" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium transition-all"
              >
                <GraduationCap className="h-4 w-4" />
                Student
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium transition-all"
              >
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <Card className="mt-6 border-0 shadow-elevated">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-semibold">
                  {activeTab === "student" ? "Student Login" : "Admin Login"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "student" 
                    ? "Enter your registered email and password"
                    : "Access the administrative dashboard"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="student" className="mt-0">
                  <LoginForm userType="student" />
                </TabsContent>
                <TabsContent value="admin" className="mt-0">
                  <LoginForm userType="admin" />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
