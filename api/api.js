const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = 3000;

const supabaseUrl = "https://dffjlxtheimqdjpcgkls.supabase.co";
const supabaseKey = "eyJhbzOTkzMTksImV4cCI6MjA0ODk3NTMxOX0.pACkq2yA-V9hrH0bw6jDOb8N-nu-slgnX2rScxY5xcU";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsOptions = {
    origin: 'https://copas-mumetment.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-key'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const adminAuth = (req, res, next) => {
    const authKey = req.headers["x-auth-key"];
    const validAuthKey = "fahriganteng123";

    if (!authKey || authKey !== validAuthKey) {
        return res.status(403).json({ error: "Akses ditolak. Kunci otorisasi tidak valid." });
    }
    next();
};

const handler = async (req, res) => {
    try {
        switch (req.method) {
            case "OPTIONS":
                res.setHeader('Access-Control-Allow-Origin', 'https://copas-mumetment.vercel.app');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                res.status(200).end();
                break;
            case "POST":
                if (req.url === "/api/admin/login") {
                    // Admin login
                    const authKey = req.headers["x-auth-key"];
                    const validAuthKey = "fahriganteng123";
                    if (!authKey || authKey !== validAuthKey) {
                        return res.status(403).json({ error: "Akses ditolak. Kunci otorisasi tidak valid." });
                    }
                    res.json({ success: true, message: "Admin login berhasil!" });
                } else if (req.url === "/api/templates") {
                    // Create template
                    const { teks } = req.body;
                    if (!teks) {
                        return res.status(400).json({ error: "Teks harus diisi" });
                    }
                    const { data, error } = await supabase
                        .from("template")
                        .insert([{ teks, status: "pending" }]);

                    if (error) throw error;
                    res.status(201).json({ success: true, data });
                }
                break;
            case "GET":
                if (req.url === "/api/templates") {
                    // Fetch confirmed templates
                    const { data, error } = await supabase
                        .from("template")
                        .select("*")
                        .eq("status", "confirmed")
                        .order("id", { ascending: true });

                    if (error) throw error;
                    res.status(200).json({ success: true, data });
                } else if (req.url.startsWith("/api/templates/") && req.params.id) {
                    // Fetch specific template
                    const { id } = req.params;
                    const { data, error } = await supabase
                        .from("template")
                        .select("*")
                        .eq("id", id)
                        .eq("status", "confirmed")
                        .single();

                    if (error) throw error;
                    if (!data) {
                        return res.status(404).json({ error: "Template tidak ditemukan" });
                    }
                    res.status(200).json({ success: true, data });
                }
                break;
            case "DELETE":
                if (req.url.startsWith("/api/templates/") && req.params.id) {
                    // Delete template (Admin only)
                    const { id } = req.params;
                    const { data, error } = await supabase
                        .from("template")
                        .delete()
                        .eq("id", id);

                    if (error) throw error;
                    if (!data || data.length === 0) {
                        return res.status(404).json({ error: "Template tidak ditemukan" });
                    }
                    res.status(200).json({ success: true, message: "Template berhasil dihapus" });
                }
                break;
            case "PUT":
                if (req.url.startsWith("/api/templates/") && req.params.id) {
                    // Update template status (Admin only)
                    const { id } = req.params;
                    const { data, error } = await supabase
                        .from("template")
                        .update({ status: "confirmed" })
                        .eq("id", id);

                    if (error) throw error;
                    if (!data || data.length === 0) {
                        return res.status(404).json({ error: "Template tidak ditemukan" });
                    }
                    res.status(200).json({ success: true, message: "Status template berhasil diubah", data: data[0] });
                }
                break;
            default:
                res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

app.all("/api/*", handler);

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
