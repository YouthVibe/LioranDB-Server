"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    School,
    Store,
    Building2,
    CheckCircle2,
    CreditCard,
    QrCode,
    Star,
    Crown,
    BadgePercent,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../utils/useAuth";
// import Navbar from "../components/landing/Navbar";
// import Footer from "../components/landing/Footer";

export default function KeyPage() {
    const { getToken } = useAuth();
    useEffect(() => {
        const getKey = async () => {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/getUser`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                // credentials: "include"
            });
            const data = await res.json();
            alert(data.accessKey);
        }
        getKey();
    }, []);
    return (
        <div>
        </div>
    );
}

/* REQUIRED PACKAGES
npm install framer-motion lucide-react
shadcn-ui init
*/