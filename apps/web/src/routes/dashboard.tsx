import { Title } from "@solidjs/meta";
import { Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { useAuth } from "../lib/auth/context";
import { logoutAction } from "../lib/auth/server";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function Dashboard() {
  const auth = useAuth();

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <ProtectedRoute>
      <Title>Dashboard - Corvus</Title>
      <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="mb-8 flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Show when={auth.user()}>
                <p class="text-gray-600 mt-1">
                  Welcome back, {auth.user()?.name}!
                </p>
              </Show>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <Show when={auth.user()}>
                  <div class="space-y-2">
                    <p>
                      <strong>Name:</strong> {auth.user()?.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {auth.user()?.email}
                    </p>
                    <p>
                      <strong>Member since:</strong>{" "}
                      {new Date(
                        auth.user()?.created_at || "",
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </Show>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <Button class="w-full" variant="outline">
                    Update Profile
                  </Button>
                  <Button class="w-full" variant="outline">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <p class="text-sm text-gray-600">
                    Account Status:{" "}
                    <span class="text-green-600 font-medium">Active</span>
                  </p>
                  <p class="text-sm text-gray-600">
                    Last Login: <span class="font-medium">Today</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
