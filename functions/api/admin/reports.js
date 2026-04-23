import { getSessionUserId } from "../../_utils/auth.js";

function resp(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function checkAdmin(env, userId) {
    const { results } = await env.DB.prepare("SELECT is_admin FROM users WHERE id = ?").bind(userId).all();
    return !!results[0]?.is_admin;
}

// GET /api/admin/reports — list all reports with content
export async function onRequestGet({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId || !(await checkAdmin(env, userId))) return resp({ error: "Forbidden" }, 403);

    const { results: reports } = await env.DB.prepare(`
        SELECT r.id, r.target_type, r.target_id, r.reason, r.created_at, r.resolved_at, r.resolved_action,
               u.username AS reporter_username, u.display_name AS reporter_name, u.avatar_emoji AS reporter_avatar
        FROM reports r
        JOIN users u ON u.id = r.reporter_id
        ORDER BY r.resolved_at IS NOT NULL ASC, r.created_at DESC
        LIMIT 100
    `).bind().all();

    const enriched = await Promise.all(reports.map(async r => {
        let content = null, author = null, author_id = null;
        try {
            let row;
            if (r.target_type === 'community_post') {
                ({ results: [row] } = await env.DB.prepare(
                    "SELECT cp.content, cp.user_id, u.username, u.display_name FROM community_posts cp JOIN users u ON u.id = cp.user_id WHERE cp.id = ?"
                ).bind(r.target_id).all());
            } else if (r.target_type === 'comment') {
                ({ results: [row] } = await env.DB.prepare(
                    "SELECT c.content, c.user_id, u.username, u.display_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?"
                ).bind(r.target_id).all());
            } else if (r.target_type === 'journal') {
                ({ results: [row] } = await env.DB.prepare(
                    "SELECT je.content, je.user_id, u.username, u.display_name FROM journal_entries je JOIN users u ON u.id = je.user_id WHERE je.id = ?"
                ).bind(r.target_id).all());
            }
            if (row) { content = row.content; author = row.display_name || row.username; author_id = row.user_id; }
        } catch (_) {}
        return { ...r, content, author, author_id };
    }));

    return resp({ reports: enriched });
}

// POST /api/admin/reports — { report_id, action: 'dismiss' | 'delete_content' | 'ban_user' }
export async function onRequestPost({ request, env }) {
    const userId = await getSessionUserId(env, request);
    if (!userId || !(await checkAdmin(env, userId))) return resp({ error: "Forbidden" }, 403);

    const { report_id, action } = await request.json().catch(() => ({}));
    if (!report_id || !action) return resp({ error: "Missing params" }, 400);

    const { results } = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(parseInt(report_id)).all();
    const report = results[0];
    if (!report) return resp({ error: "Report not found" }, 404);

    const now = Math.floor(Date.now() / 1000);

    if (action === 'delete_content') {
        if (report.target_type === 'community_post') {
            await env.DB.prepare("DELETE FROM community_posts WHERE id = ?").bind(report.target_id).run().catch(() => {});
            await env.DB.prepare("DELETE FROM reactions WHERE target_type = 'community_post' AND target_id = ?").bind(report.target_id).run().catch(() => {});
            await env.DB.prepare("DELETE FROM comments WHERE target_type = 'community_post' AND target_id = ?").bind(report.target_id).run().catch(() => {});
        } else if (report.target_type === 'comment') {
            await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(report.target_id).run().catch(() => {});
        } else if (report.target_type === 'journal') {
            await env.DB.prepare("UPDATE journal_entries SET is_public = 0 WHERE id = ?").bind(report.target_id).run().catch(() => {});
        }
        // Resolve all reports for this same content
        await env.DB.prepare(
            "UPDATE reports SET resolved_at = ?, resolved_action = 'deleted' WHERE target_type = ? AND target_id = ?"
        ).bind(now, report.target_type, report.target_id).run();
    } else if (action === 'ban_user') {
        if (!report.author_id) return resp({ error: "No author found" }, 400);
        await env.DB.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").bind(parseInt(report.author_id)).run().catch(() => {});
        await env.DB.prepare(
            "UPDATE reports SET resolved_at = ?, resolved_action = 'banned' WHERE id = ?"
        ).bind(now, parseInt(report_id)).run();
    } else {
        // dismiss
        await env.DB.prepare(
            "UPDATE reports SET resolved_at = ?, resolved_action = 'dismissed' WHERE id = ?"
        ).bind(now, parseInt(report_id)).run();
    }

    return resp({ success: true });
}
