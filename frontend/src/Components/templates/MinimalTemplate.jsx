const MinimalTemplate = ({ data, accentColor }) => {
    return (
        <div className="max-w-4xl mx-auto p-10 bg-white text-gray-900 font-light font-sans h-full min-h-[297mm]">
            <header className="mb-12">
                <h1 className="text-5xl font-thin mb-4 tracking-wide">
                    {data.personal_info?.full_name}
                </h1>
                <div className="flex flex-wrap gap-6 text-sm text-gray-500 uppercase tracking-widest">
                    {data.personal_info?.email && (
                        <span>{data.personal_info.email}</span>
                    )}
                    {data.personal_info?.phone && (
                        <span>{data.personal_info.phone}</span>
                    )}
                    {data.personal_info?.location && (
                        <span>{data.personal_info.location}</span>
                    )}
                </div>
            </header>

            {data.professional_summary && (
                <p className="mb-10 text-gray-700 leading-relaxed">
                    {data.professional_summary}
                </p>
            )}

            <div className="space-y-10">
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2
                            className="text-sm uppercase tracking-widest mb-6 font-bold"
                            style={{ color: accentColor }}
                        >
                            Experience
                        </h2>
                        {data.experience.map((exp, i) => (
                            <div key={i} className="mb-6">
                                <h3 className="text-xl font-normal">
                                    {exp.position}
                                </h3>
                                <p className="text-gray-500 text-sm mb-2">
                                    {exp.company}
                                </p>
                                <p className="text-gray-700 text-sm">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </section>
                )}
                {/* Add other sections */}
            </div>
        </div>
    );
};
export default MinimalTemplate;
