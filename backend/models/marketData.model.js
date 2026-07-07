import mongoose from "mongoose";

/**
 * Stores trending technical skills extracted from job postings via Gemini AI.
 * Updated on a rolling basis by the marketAnalyzer cron job.
 */
const marketDataSchema = new mongoose.Schema(
    {
        skill: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        // Display-friendly version of the skill name (original casing)
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        // How many job postings mentioned this skill in the last analysis run
        frequency: {
            type: Number,
            required: true,
            default: 1,
            min: 0,
        },
        // Rank among the top skills (1 = most popular)
        rank: {
            type: Number,
            default: null,
        },
        // Category tag extracted by Gemini (e.g. "frontend", "cloud", "data")
        category: {
            type: String,
            default: "general",
            lowercase: true,
        },
        // Source API / job board from which the data was collected
        source: {
            type: String,
            default: "the-muse",
        },
        // Timestamp of the last cron run that updated this record
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: "marketdata",
    }
);

// Index for fast rank-ordered queries
marketDataSchema.index({ rank: 1 });
marketDataSchema.index({ frequency: -1 });

const MarketData = mongoose.model("MarketData", marketDataSchema);
export default MarketData;
