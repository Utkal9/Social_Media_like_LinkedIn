import React from "react";
import ClassicTemplate from "./templates/ClassicTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import MinimalImageTemplate from "./templates/MinimalImageTemplate";
import LpuTemplate from "./templates/LpuTemplate";

const ResumePreview = ({ data, template, accentColor }) => {
    const renderTemplate = () => {
        switch (template) {
            case "lpu":
                return <LpuTemplate data={data} accentColor={accentColor} />;
            case "modern":
                return <ModernTemplate data={data} accentColor={accentColor} />;
            case "minimal":
                return (
                    <MinimalTemplate data={data} accentColor={accentColor} />
                );
            case "minimal-image":
                return (
                    <MinimalImageTemplate
                        data={data}
                        accentColor={accentColor}
                    />
                );
            default:
                return (
                    <ClassicTemplate data={data} accentColor={accentColor} />
                );
        }
    };

    return (
        <div className="w-full flex justify-center bg-gray-50/50 py-8 print:p-0 print:bg-white print:block">
            {/* A4 Container */}
            <div
                id="resume-preview"
                className="bg-white shadow-xl w-[210mm] min-h-[297mm] origin-top print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0 print:m-0"
            >
                {renderTemplate()}
            </div>

            {/* --- CRITICAL FIX FOR BLANK PDF --- */}
            <style jsx global>{`
                @media print {
                    /* 1. Reset Page & Body */
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        margin: 0 !important;
                    }

                    /* 2. Hide Everything by Default */
                    body * {
                        visibility: hidden;
                    }

                    /* 3. Force Visibility of Resume & Children */
                    #resume-preview, #resume-preview * {
                        visibility: visible !important;
                    }

                    /* 4. Position Resume on Top */
                    #resume-preview {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999; /* Top layer */
                    }

                    /* 5. Hide Navbar/Footer Explicitly (Just in case) */
                    nav, footer, header, .Toaster, button {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ResumePreview;
