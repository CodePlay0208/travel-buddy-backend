const mongoose = require("mongoose");
const Gender = require("../enums/Gender");

const agentDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  emailId: { type: String},
  gender: { type: String, enum: Object.values(Gender) },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  callDate: { type: Date, required: true },
  companyName: { type: String, required: true },
  callSummary: { type: Number},
  responseType: { type: String },
  agentDataId: {type: String},
  createdAt: { type: Date, default: Date.now },
});

agentDataSchema.index({ phoneNumber: 1 }, { name: "phoneNumber_single_index" });
agentDataSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

module.exports = mongoose.model("AgentData", agentDataSchema);
