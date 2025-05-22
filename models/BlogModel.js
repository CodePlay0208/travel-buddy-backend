const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema(
  {
    h1: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
  },
  { _id: false }
);

const BlogSchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  blogImage: { type: String },
  category: { type: String, default: "general" },
  seo: {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  hero: {
    h1: { type: String, required: true },
    description: { type: String, required: true },
  },
  sections: [SectionSchema],
  authorId: { type: String },
  tags: [{ type: String }],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1 });
BlogSchema.index({ authorId: 1 });
BlogSchema.index({ tags: 1 });

module.exports = mongoose.model("BlogV2", BlogSchema, "blogs_v2");
