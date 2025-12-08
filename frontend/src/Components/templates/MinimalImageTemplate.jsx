import { Mail, Phone, MapPin } from "lucide-react";

const MinimalImageTemplate = ({ data, accentColor }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month] = dateStr.split("-");
        return new Date(year, month - 1).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        });
    };

    return (
        <div className="max-w-5xl mx-auto bg-white text-zinc-800 font-sans h-full">
            <div className="grid grid-cols-3 min-h-full">
                {/* Left Sidebar */}
                <aside className="col-span-1 border-r border-zinc-200 p-8 flex flex-col h-full bg-gray-50">
                    {/* Image */}
                    <div className="mb-8 flex justify-center">
                        {data.personal_info?.image ? (
                            <img
                                src={
                                    typeof data.personal_info.image === "string"
                                        ? data.personal_info.image
                                        : URL.createObjectURL(
                                              data.personal_info.image
                                          )
                                }
                                alt="Profile"
                                className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>

                    {/* Contact */}
                    <section className="mb-8">
                        <h2 className="text-xs font-bold tracking-widest text-zinc-500 mb-4 uppercase">
                            Contact
                        </h2>
                        <div className="space-y-3 text-sm">
                            {data.personal_info?.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone
                                        size={14}
                                        style={{ color: accentColor }}
                                    />
                                    <span className="text-zinc-600">
                                        {data.personal_info.phone}
                                    </span>
                                </div>
                            )}
                            {data.personal_info?.email && (
                                <div className="flex items-center gap-3">
                                    <Mail
                                        size={14}
                                        style={{ color: accentColor }}
                                    />
                                    <span className="text-zinc-600 break-all">
                                        {data.personal_info.email}
                                    </span>
                                </div>
                            )}
                            {data.personal_info?.location && (
                                <div className="flex items-center gap-3">
                                    <MapPin
                                        size={14}
                                        style={{ color: accentColor }}
                                    />
                                    <span className="text-zinc-600">
                                        {data.personal_info.location}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-xs font-bold tracking-widest text-zinc-500 mb-4 uppercase">
                                Skills
                            </h2>
                            <ul className="space-y-2 text-sm text-zinc-600">
                                {data.skills.map((skill, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: accentColor }}
                                        />
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold tracking-widest text-zinc-500 mb-4 uppercase">
                                Education
                            </h2>
                            <div className="space-y-4 text-sm">
                                {data.education.map((edu, index) => (
                                    <div key={index}>
                                        <p className="font-bold text-zinc-800">
                                            {edu.degree}
                                        </p>
                                        <p className="text-zinc-600">
                                            {edu.institution}
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            {formatDate(edu.graduation_date)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>

                {/* Right Content */}
                <main className="col-span-2 p-10">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-zinc-800 tracking-tight mb-2">
                            {data.personal_info?.full_name || "Your Name"}
                        </h1>
                        <p
                            className="text-lg font-medium tracking-wide uppercase"
                            style={{ color: accentColor }}
                        >
                            {data.personal_info?.profession || "Profession"}
                        </p>
                    </div>

                    {data.professional_summary && (
                        <section className="mb-10">
                            <h2 className="text-sm font-bold tracking-widest text-zinc-400 mb-4 uppercase flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-zinc-200"></span>{" "}
                                Summary
                            </h2>
                            <p className="text-zinc-600 leading-relaxed">
                                {data.professional_summary}
                            </p>
                        </section>
                    )}

                    {data.experience && data.experience.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-sm font-bold tracking-widest text-zinc-400 mb-6 uppercase flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-zinc-200"></span>{" "}
                                Experience
                            </h2>
                            <div className="space-y-8">
                                {data.experience.map((exp, index) => (
                                    <div
                                        key={index}
                                        className="relative pl-4 border-l-2 border-zinc-100"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-lg text-zinc-800">
                                                {exp.position}
                                            </h3>
                                            <span className="text-xs font-medium px-2 py-1 bg-zinc-100 rounded text-zinc-500">
                                                {formatDate(exp.start_date)} -{" "}
                                                {exp.is_current
                                                    ? "Present"
                                                    : formatDate(exp.end_date)}
                                            </span>
                                        </div>
                                        <p
                                            className="text-sm font-medium mb-3"
                                            style={{ color: accentColor }}
                                        >
                                            {exp.company}
                                        </p>
                                        {exp.description && (
                                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.project && data.project.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold tracking-widest text-zinc-400 mb-6 uppercase flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-zinc-200"></span>{" "}
                                Projects
                            </h2>
                            <div className="grid gap-6">
                                {data.project.map((project, index) => (
                                    <div
                                        key={index}
                                        className="bg-zinc-50 p-4 rounded-lg"
                                    >
                                        <h3 className="font-bold text-zinc-800">
                                            {project.name}
                                        </h3>
                                        <p
                                            className="text-xs font-bold uppercase mb-2 mt-1"
                                            style={{ color: accentColor }}
                                        >
                                            {project.type}
                                        </p>
                                        <p className="text-sm text-zinc-600">
                                            {project.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};
export default MinimalImageTemplate;
