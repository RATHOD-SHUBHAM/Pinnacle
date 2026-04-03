"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, LayoutDashboard, Stethoscope, Calendar } from "lucide-react";
import { SITE_NAME } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">
            P
          </span>
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/doctors"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Doctors
          </Link>
          {session?.user?.role === "PATIENT" && (
            <Link
              href="/bookings"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              My bookings
            </Link>
          )}
          {isStaff && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1">
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          {status === "loading" ? (
            <span className="text-sm text-muted-foreground">…</span>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  {session.user?.name || session.user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {session.user?.role === "PATIENT" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        My bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1">
                  <Stethoscope className="h-4 w-4" />
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
