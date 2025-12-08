import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

const ModernTemplate = ({ data, accentColor }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month] = dateStr.split("-");
        return new Date(year, month - 1).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        });
    };

    return (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 font-sans h-full min-h-[297mm]">
            <header
                className="p-8 text-white"
                style={{ backgroundColor: accentColor }}
            >
                <h1 className="text-4xl font-light mb-3 tracking-wide">
                    {data.personal_info?.full_name || "Your Name"}
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm opacity-90">
                    {data.personal_info?.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{data.personal_info.email}</span>
                        </div>
                    )}
                    {data.personal_info?.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{data.personal_info.phone}</span>
                        </div>
                    )}
                    {data.personal_info?.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{data.personal_info.location}</span>
                        </div>
                    )}
                    {data.personal_info?.linkedin && (
                        <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">
                                {data.personal_info.linkedin}
                            </span>
                        </div>
                    )}
                    {data.personal_info?.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">
                                {data.personal_info.website}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <div className="p-8">
                {data.professional_summary && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-light mb-4 pb-2 border-b border-gray-200 text-gray-800">
                            Professional Summary
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            {data.professional_summary}
                        </p>
                    </section>
                )}

                {data.experience && data.experience.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-light mb-6 pb-2 border-b border-gray-200 text-gray-800">
                            Experience
                        </h2>
                        <div className="space-y-6">
                            {data.experience.map((exp, index) => (
                                <div
                                    key={index}
                                    className="relative pl-6 border-l-2 border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-medium text-gray-900">
                                                {exp.position}
                                            </h3>
                                            <p
                                                className="font-medium"
                                                style={{ color: accentColor }}
                                            >
                                                {exp.company}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded">
                                            {formatDate(exp.start_date)} -{" "}
                                            {exp.is_current
                                                ? "Present"
                                                : formatDate(exp.end_date)}
                                        </div>
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-700 leading-relaxed mt-3 whitespace-pre-line text-sm">
                                            {exp.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.education && data.education.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-light mb-4 pb-2 border-b border-gray-200 text-gray-800">
                            Education
                        </h2>
                        <div className="space-y-4">
                            {data.education.map((edu, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-gray-900">
                                        {edu.degree}
                                    </h3>
                                    <p style={{ color: accentColor }}>
                                        {edu.institution}
                                    </p>
                                    <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>
                                            {formatDate(edu.graduation_date)}
                                        </span>
                                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-light mb-4 pb-2 border-b border-gray-200 text-gray-800">
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm text-white rounded-full shadow-sm"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
export default ModernTemplate;
