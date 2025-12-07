import React from "react";
import {
    BriefcaseBusiness,
    Globe,
    Linkedin,
    Mail,
    MapPin,
    Phone,
    User,
} from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const PersonalInfoForm = ({
    data,
    onChange,
    removeBackground,
    setRemoveBackground,
}) => {
    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const fields = [
        {
            key: "full_name",
            label: "Full Name",
            icon: User,
            type: "text",
            required: true,
        },
        {
            key: "email",
            label: "Email Address",
            icon: Mail,
            type: "email",
            required: true,
        },
        { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
        { key: "location", label: "Location", icon: MapPin, type: "text" },
        {
            key: "profession",
            label: "Profession",
            icon: BriefcaseBusiness,
            type: "text",
        },
        {
            key: "linkedin",
            label: "LinkedIn Profile",
            icon: Linkedin,
            type: "url",
        },
        { key: "website", label: "Personal Website", icon: Globe, type: "url" },
    ];

    return (
        <div className={styles.formSection}>
            <div style={{ marginBottom: "20px" }}>
                <h3 className={styles.sectionTitle}>Personal Information</h3>
                <p className={styles.sectionDesc}>
                    Get Started with the personal information
                </p>
            </div>

            <div className={styles.imageUploadSection}>
                <label style={{ cursor: "pointer" }}>
                    {data.image ? (
                        <img
                            src={
                                typeof data.image === "string"
                                    ? data.image
                                    : URL.createObjectURL(data.image)
                            }
                            alt="user-image"
                            className={styles.previewImage}
                        />
                    ) : (
                        <div className={styles.uploadPlaceholder}>
                            <div className={styles.uploadIconBox}>
                                <User size={24} />
                            </div>
                            <span>upload user image</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/jpeg, image/png"
                        className="hidden"
                        style={{ display: "none" }}
                        onChange={(e) =>
                            handleChange("image", e.target.files[0])
                        }
                    />
                </label>

                {/* EXACT LOGIC: Show toggle only if image is an object (newly uploaded) */}
                {typeof data.image === "object" && (
                    <div className={styles.toggleContainer}>
                        <p className={styles.toggleText}>Remove Background</p>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                className={`${styles.toggleInput} ${styles.srOnly}`}
                                onChange={() =>
                                    setRemoveBackground((prev) => !prev)
                                }
                                checked={removeBackground}
                            />
                            <div className={styles.toggleTrack}>
                                <span className={styles.toggleDot}></span>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            <div className={styles.grid2}>
                {fields.map((field) => {
                    const Icon = field.icon;
                    return (
                        <div
                            key={field.key}
                            className={styles.inputGroup}
                            style={
                                field.key === "linkedin" ||
                                field.key === "website"
                                    ? { gridColumn: "1 / -1" }
                                    : {}
                            }
                        >
                            <label className={styles.label}>
                                <Icon size={14} /> {field.label}
                                {field.required && (
                                    <span className={styles.required}>*</span>
                                )}
                            </label>
                            <input
                                type={field.type}
                                value={data[field.key] || ""}
                                onChange={(e) =>
                                    handleChange(field.key, e.target.value)
                                }
                                className={styles.input}
                                placeholder={`Enter your ${field.label.toLowerCase()}`}
                                required={field.required}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PersonalInfoForm;
