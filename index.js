const express = require("express");
const app = express();
const cors = require("cors"); //Added this to resolve error of cors-connection
app.use(cors());
const Joi = require("@hapi/joi");
const index = require("./index");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

app.use(express.static("public"));
app.use(express.json());

mongoose
  // .connect("mongodb://0.0.0.0:27017/playground")
  .connect("mongodb+srv://ankit:ankit@cluster0.f8dv4gh.mongodb.net/demo-covid")
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.error("Couldn't connect to db", err));

const covidStateSchema = new mongoose.Schema({
  state: { type: String, required: true },
  total: { type: String, required: true },
  recovered: { type: String, required: true },
  activeCases: { type: String, required: true },
  death: { type: String, required: true },
  vaccinated: { type: String, required: true },
  lastUpdated: { default: Date.now, type: Date, required: true },
});

const CovidData = mongoose.model("MasterCovid", covidStateSchema);

function dataValidate(data) {
  const schema = {
    state: Joi.string().max(50).required(),
    total: Joi.string().max(50).required(),
    recovered: Joi.string().max(50).required(),
    activeCases: Joi.string().max(50).required(),
    death: Joi.string().max(50).required(),
    vaccinated: Joi.string().max(50).required(),
  };
  return Joi.validate(data, schema);
}

app.get("/", async (req, res) => {
  const allCases = await CovidData.find();
  // res.send(`There are total ${allCases.length} cases in India`);
  res.json(allCases);
});

app.post("/api/data", (req, res) => {
  const {error} = dataValidate(req.body);
  if (error) return res.status(400).send(error);
  saveNewRecord(req.body);
  res.send("Data Validation Success and Saved successfully");
});

async function saveNewRecord(record) {
  //if state already exist
  const present = await CovidData.findOne(
    { state: record.state },
    (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
    }
  ).clone();
  // console.log(present); //checks if "state" is present or not
  if (present) {
    // if already saved then update
    const filter = { state: present.state };
    const update = record;
    CovidData.updateOne(filter, update, (err, res) => {
      if (err) return;
      console.log(res);
    });
    console.log("Already Saved");
  } else {
    const newRecord = new CovidData(record);
    newRecord
      .save()
      .then((data) => console.log(data))
      .catch((err) => console.log(err));
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}!`);
});
