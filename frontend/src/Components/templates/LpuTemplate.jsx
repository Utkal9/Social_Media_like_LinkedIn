import React from "react";
import { ExternalLink } from "lucide-react";

const LpuTemplate = ({ data, accentColor }) => {
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
                style={{ fontSize: "8pt" }}
            >
                Link <ExternalLink size={8} />
            </a>
        );
    };

    const SectionHeader = ({ title }) => (
        <div
            className="mb-1 border-b-[1px] pb-0.5"
            style={{ borderColor: "#BFBFBF" }}
        >
            <h2
                className="text-[10pt] font-bold uppercase tracking-wide"
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
                fontSize: "9pt",
                lineHeight: "1.2",
                padding: "0.3in 0.4in",
                minHeight: "297mm",
            }}
        >
            {/* --- HEADER --- */}
            <header className="mb-2">
                <h1
                    className="text-[18pt] font-bold mb-1 text-left leading-none"
                    style={{ color: themeColor }}
                >
                    {data.personal_info?.full_name || "YOUR NAME"}
                </h1>

                <div className="grid grid-cols-[1.4fr_1fr] gap-x-2 text-[9pt] leading-tight">
                    <div>
                        {data.personal_info?.linkedin && (
                            <div className="flex">
                                <span className="font-bold w-[65px]">
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
                                <span className="font-bold w-[65px]">
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
                                <span className="font-bold w-[65px]">
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
                    <div className="text-right">
                        {data.personal_info?.email && (
                            <div className="flex justify-end">
                                <span className="font-bold mr-1">Email:</span>
                                <span>{data.personal_info.email}</span>
                            </div>
                        )}
                        {data.personal_info?.phone && (
                            <div className="flex justify-end">
                                <span className="font-bold mr-1">Mobile:</span>
                                <span>{data.personal_info.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* --- SKILLS --- */}
            {data.skills && (
                <section className="mb-2">
                    <SectionHeader title="SKILLS" />
                    <div className="grid grid-cols-[130px_1fr] gap-y-0 text-[9pt] leading-snug">
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

            {/* --- EXPERIENCE (Added this back!) --- */}
            {data.experience && data.experience.length > 0 && (
                <section className="mb-2">
                    <SectionHeader title="EXPERIENCE" />
                    <div className="space-y-1.5">
                        {data.experience.map((exp, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline leading-none mb-0.5">
                                    <div className="text-[10pt]">
                                        <span className="font-bold">
                                            {exp.company}
                                        </span>
                                        {exp.location && (
                                            <span className="font-normal text-gray-900">
                                                , {exp.location}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[9pt] font-bold text-gray-900 whitespace-nowrap ml-2">
                                        {exp.start_date || exp.end_date
                                            ? `${exp.start_date || ""} - ${
                                                  exp.is_current
                                                      ? "Present"
                                                      : exp.end_date || ""
                                              }`
                                            : ""}
                                    </div>
                                </div>
                                <div className="text-[9pt] font-medium italic mb-0.5">
                                    {exp.position}
                                </div>
                                {exp.description && (
                                    <ul className="list-disc list-outside ml-4 text-[9pt] text-justify leading-[1.25] text-gray-800">
                                        {exp.description
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

            {/* --- PROJECTS --- */}
            {data.project && data.project.length > 0 && (
                <section className="mb-2">
                    <SectionHeader title="PROJECTS" />
                    <div className="space-y-1.5">
                        {data.project.map((proj, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline leading-none mb-0.5">
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
                                    <div className="text-[9pt] font-bold text-gray-900 whitespace-nowrap ml-2">
                                        {proj.duration}
                                    </div>
                                </div>
                                {proj.live_link && (
                                    <div className="text-[8.5pt] mb-0.5 text-gray-700">
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
                                    <ul className="list-disc list-outside ml-4 text-[9pt] text-justify leading-[1.25] text-gray-800">
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
                <section className="mb-2">
                    <SectionHeader title="CERTIFICATES" />
                    <div className="space-y-0">
                        {data.certificates.map((cert, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-baseline text-[9pt] leading-snug"
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
                                <div className="whitespace-nowrap ml-4 text-gray-900 font-bold">
                                    {cert.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- ACHIEVEMENTS --- */}
            {data.achievements && data.achievements.length > 0 && (
                <section className="mb-2">
                    <SectionHeader title="ACHIEVEMENTS" />
                    <div className="space-y-1">
                        {data.achievements.map((ach, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline text-[9pt] leading-none mb-0.5">
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
                                    <div className="whitespace-nowrap ml-4 text-gray-900 font-bold">
                                        {ach.date}
                                    </div>
                                </div>
                                {ach.description && (
                                    <p className="text-[9pt] leading-tight pl-0.5 text-gray-800">
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
                <section className="mb-1">
                    <SectionHeader title="EDUCATION" />
                    <div className="space-y-1.5">
                        {data.education.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline font-bold text-[9.5pt] leading-none mb-0.5">
                                    <span>{edu.institution}</span>
                                    <span className="text-[9pt]">
                                        {edu.location || "India"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline text-[9pt] leading-none">
                                    <div className="text-gray-800">
                                        <span>
                                            {edu.degree}{" "}
                                            {edu.field ? `- ${edu.field}` : ""}
                                        </span>
                                        {edu.gpa && (
                                            <span>
                                                ;{" "}
                                                <span className="font-bold">
                                                    CGPA/Percentage: {edu.gpa}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap ml-4 font-bold text-gray-900">
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
