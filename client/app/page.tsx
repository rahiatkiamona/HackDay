import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Auth App
          </CardTitle>
          <CardDescription className="text-lg">
            A modern authentication system built with Next.js, Shadcn UI, and FastAPI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">🚀 Features</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Modern authentication with JWT tokens</li>
                <li>• Secure password hashing with bcrypt</li>
                <li>• Token refresh mechanism</li>
                <li>• MySQL database backend</li>
                <li>• Beautiful UI with Shadcn components</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Built with ❤️ using Next.js 15 and FastAPI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
