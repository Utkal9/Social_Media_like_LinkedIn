import React from "react";
import { ExternalLink } from "lucide-react";

const LpuTemplate = ({ data, accentColor }) => {
    // Exact Blue from your CV
    const themeColor = accentColor || "#2E74B5";

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month] = dateStr.split("-");
        const date = new Date(year, month - 1);
        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    const DocLink = ({ url }) => {
        if (!url) return null;
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:underline font-bold inline-flex items-center gap-0.5 ml-1"
                style={{ fontSize: "9pt" }}
            >
                Link <ExternalLink size={8} />
            </a>
        );
    };

    const SectionHeader = ({ title }) => (
        <div
            className="mb-1.5 border-b-[1px] pb-0.5"
            style={{ borderColor: "#BFBFBF" }}
        >
            <h2
                className="text-[10.5pt] font-bold uppercase tracking-wide"
                style={{ color: themeColor, fontFamily: "Arial, sans-serif" }}
            >
                {title}
            </h2>
        </div>
    );

    return (
        <div
            className="w-full h-full bg-white text-black box-border"
            style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "9.5pt", // Base font size reduced
                lineHeight: "1.25", // Tighter lines
                padding: "0.4in 0.5in", // Exact margins from your doc
                minHeight: "297mm", // Ensure A4 height visual
            }}
        >
            {/* --- HEADER --- */}
            <header className="mb-3">
                <h1
                    className="text-[20pt] font-bold mb-1.5 text-left leading-none"
                    style={{ color: themeColor }}
                >
                    {data.personal_info?.full_name || "UTKAL BEHERA"}
                </h1>

                <div className="grid grid-cols-[1.3fr_1fr] gap-x-2 text-[9pt] leading-tight">
                    {/* Left Column */}
                    <div>
                        {data.personal_info?.linkedin && (
                            <div className="flex">
                                <span className="font-bold w-[70px]">
                                    LinkedIn:
                                </span>
                                <a
                                    href={data.personal_info.linkedin}
                                    className="text-blue-800 hover:underline truncate"
                                >
                                    {data.personal_info.linkedin.replace(
                                        /^https?:\/\/(www\.)?/,
                                        ""
                                    )}
                                </a>
                            </div>
                        )}
                        {data.personal_info?.github && (
                            <div className="flex">
                                <span className="font-bold w-[70px]">
                                    GitHub:
                                </span>
                                <a
                                    href={data.personal_info.github}
                                    className="text-blue-800 hover:underline truncate"
                                >
                                    {data.personal_info.github.replace(
                                        /^https?:\/\/(www\.)?/,
                                        ""
                                    )}
                                </a>
                            </div>
                        )}
                        {data.personal_info?.leetcode && (
                            <div className="flex">
                                <span className="font-bold w-[70px]">
                                    LeetCode:
                                </span>
                                <a
                                    href={data.personal_info.leetcode}
                                    className="text-blue-800 hover:underline truncate"
                                >
                                    {data.personal_info.leetcode.replace(
                                        /^https?:\/\/(www\.)?/,
                                        ""
                                    )}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div>
                        {data.personal_info?.email && (
                            <div className="flex">
                                <span className="font-bold w-[55px]">
                                    Email:
                                </span>
                                <span>{data.personal_info.email}</span>
                            </div>
                        )}
                        {data.personal_info?.phone && (
                            <div className="flex">
                                <span className="font-bold w-[55px]">
                                    Mobile:
                                </span>
                                <span>{data.personal_info.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* --- SKILLS --- */}
            {data.skills && (
                <section className="mb-3">
                    <SectionHeader title="SKILLS" />
                    <div className="grid grid-cols-[135px_1fr] gap-y-0.5 text-[9.5pt]">
                        {data.skillLanguages && (
                            <>
                                <div className="font-bold">Languages :</div>
                                <div>{data.skillLanguages}</div>
                            </>
                        )}
                        {data.skillCloudDevOps && (
                            <>
                                <div className="font-bold">Cloud & DevOps:</div>
                                <div>{data.skillCloudDevOps}</div>
                            </>
                        )}
                        {data.skillFrameworks && (
                            <>
                                <div className="font-bold">Frameworks :</div>
                                <div>{data.skillFrameworks}</div>
                            </>
                        )}
                        {data.skillTools && (
                            <>
                                <div className="font-bold">
                                    Tools/Platforms :
                                </div>
                                <div>{data.skillTools}</div>
                            </>
                        )}
                        {data.skillSoft && (
                            <>
                                <div className="font-bold">Soft Skills :</div>
                                <div>{data.skillSoft}</div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* --- PROJECTS --- */}
            {data.project && data.project.length > 0 && (
                <section className="mb-3">
                    <SectionHeader title="PROJECTS" />
                    <div className="space-y-2">
                        {data.project.map((proj, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline leading-tight">
                                    <div className="text-[10pt]">
                                        <span className="font-bold">
                                            {proj.name}
                                        </span>
                                        {proj.type && (
                                            <span className="font-normal text-gray-900">
                                                {" "}
                                                – {proj.type}
                                            </span>
                                        )}
                                        {proj.link && (
                                            <span>
                                                : <DocLink url={proj.link} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[9pt] font-medium text-gray-900 whitespace-nowrap ml-2">
                                        {proj.duration}
                                    </div>
                                </div>

                                {proj.live_link && (
                                    <div className="text-[9pt] mb-0.5">
                                        <span className="font-bold">
                                            Live Demo:{" "}
                                        </span>
                                        <a
                                            href={proj.live_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-700 hover:underline"
                                        >
                                            Launch App
                                        </a>
                                    </div>
                                )}

                                {proj.description && (
                                    <ul className="list-disc list-outside ml-4 text-[9.5pt] text-justify leading-[1.3]">
                                        {proj.description
                                            .split("\n")
                                            .filter((line) => line.trim())
                                            .map((line, i) => (
                                                <li key={i} className="pl-1">
                                                    {line.replace(
                                                        /^[-•]\s*/,
                                                        ""
                                                    )}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- CERTIFICATES --- */}
            {data.certificates && data.certificates.length > 0 && (
                <section className="mb-3">
                    <SectionHeader title="CERTIFICATES" />
                    <div className="space-y-0.5">
                        {data.certificates.map((cert, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-baseline text-[9.5pt]"
                            >
                                <div className="flex-1">
                                    <span>{cert.name}</span>
                                    {cert.link && (
                                        <span>
                                            {" "}
                                            <DocLink url={cert.link} />
                                        </span>
                                    )}
                                </div>
                                <div className="whitespace-nowrap ml-4 text-gray-900 font-medium">
                                    {cert.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- ACHIEVEMENTS --- */}
            {data.achievements && data.achievements.length > 0 && (
                <section className="mb-3">
                    <SectionHeader title="ACHIEVEMENTS" />
                    <div className="space-y-1">
                        {data.achievements.map((ach, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline text-[9.5pt]">
                                    <div>
                                        <span className="font-bold">
                                            {ach.title}
                                        </span>
                                        {ach.link && (
                                            <span>
                                                {" "}
                                                : <DocLink url={ach.link} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap ml-4 text-gray-900 font-medium">
                                        {ach.date}
                                    </div>
                                </div>
                                {ach.description && (
                                    <p className="text-[9.5pt] leading-tight pl-0.5">
                                        {ach.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- EDUCATION --- */}
            {data.education && data.education.length > 0 && (
                <section className="mb-2">
                    <SectionHeader title="EDUCATION" />
                    <div className="space-y-1.5">
                        {data.education.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline font-bold text-[10pt]">
                                    <span>{edu.institution}</span>
                                    <span className="text-[9pt]">
                                        {edu.location || "India"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline text-[9.5pt]">
                                    <div>
                                        <span>
                                            {edu.degree}{" "}
                                            {edu.field ? `- ${edu.field}` : ""}
                                        </span>
                                        {edu.gpa && (
                                            <span>
                                                ;{" "}
                                                <span className="font-medium">
                                                    CGPA/Percentage: {edu.gpa}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap ml-4 font-medium">
                                        {edu.graduation_date
                                            ? `Since ${formatDate(
                                                  edu.graduation_date
                                              )}`
                                            : edu.years || ""}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default LpuTemplate;
