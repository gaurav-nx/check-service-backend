const NodeCache = require("node-cache");
const countryCache = new NodeCache();
const countrySchema = require('../model/country.modal');
const Countrys = require('country-state-city').Country;

const addCountry = async (req, res) => {
    try {
        const countries = Countrys.getAllCountries(); // Assuming Countrys is an object containing countries data
        for (const country of countries) {
            const newCountry = new countrySchema({
                name: country.name,
                short_name: country.isoCode // Assuming isoCode holds the short name
            });
            await newCountry.save();
        }
        return res.status(200).json({ error: false, message: "Countries added successfully", data: null });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: true, message: "Internal Server error", data: null });
    }
};

const listCountry = async (req, res) => {
    try {
        let list = countryCache.get("countries");
        if (!list) {
            list = await countrySchema.find(); // Fetch countries from the database if not found in cache
            if (list && list.length > 0) {
                countryCache.set("countries", list);
                return res.status(200).json({ error: false, message: "Countries list successfully found", data: list });
            } else {
                return res.status(200).json({ error: true, message: "Countries list not found", data: null });
            }
        } else {
            return res.status(200).json({ error: false, message: "Countries list successfully found", data: list });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null })
    }
};

module.exports = { addCountry, listCountry };