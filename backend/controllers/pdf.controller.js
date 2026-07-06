import puppeteer from "puppeteer";
import Resume from "../models/resume.model.js";

// GET: /resume/export/pdf/:id
export const exportResumeToPdf = async (req, res) => {
    let browser = null;
    try {
        const { id } = req.params;

        // Fetch the resume from DB — already have the data, no extra HTTP needed
        const resume = await Resume.findById(id).lean();
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        // Frontend base URL (strips inline comments like "# Change this on Render")
        const frontendBaseUrl =
            (process.env.FRONTEND_URL || "http://localhost:3000")
                .replace(/\s*#.*/, "")
                .trim();

        // We visit the public resume page and INJECT the resume data directly
        // via window.__RESUME_DATA__ before the React app fetches anything.
        // This avoids any API call from within Puppeteer's browser context.
        const targetUrl = `${frontendBaseUrl}/resume/${id}?print=1`;

        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

        // Inject resume data into the window BEFORE navigation so the page reads it
        await page.evaluateOnNewDocument((resumeJSON) => {
            window.__RESUME_DATA__ = resumeJSON;
        }, JSON.stringify(resume));

        // Navigate — wait only for DOM (not full network) since we inject data
        await page.goto(targetUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        // Wait for React to hydrate and render the resume content
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Hide any non-print UI (buttons, navbar, loading spinner)
        await page.evaluate(() => {
            document.querySelectorAll("button, nav, header, [data-hide-print]").forEach(
                (el) => (el.style.display = "none")
            );
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
        });

        await browser.close();

        const safeTitle = (resume.title || "Resume").replace(/[^a-z0-9_\- ]/gi, "_");

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
            "Content-Length": pdfBuffer.length,
        });
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        if (browser) await browser.close();
        console.error("PDF Export Error:", error);
        return res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
};
