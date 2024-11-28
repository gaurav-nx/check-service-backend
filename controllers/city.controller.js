const NodeCache = require("node-cache");
const cityCache = new NodeCache();
const citySchema = require('../model/city.modal');
const City = require('country-state-city').City

const addCity = async (req, res) => {
    try {
        const Cities = City.getAllCities(); // Assuming Countrys is an object containing countries data
        for (const city of Cities) {
            const newState = new citySchema({
                name: city.name,
                country_code: city.countryCode, // Assuming isoCode holds the short name
                state_code: city.stateCode
            });
            await newState.save();
        }
        return res.status(200).json({ error: false, message: "City added successfully", data: null });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: true, message: "Internal Server error", data: null });
    }
};

const listCity = async (req, res) => {
    try {
        let list = cityCache.get("city");
        if (!list) {
            list = await citySchema.find(); // Fetch countries from the database if not found in cache
            if (list && list.length > 0) {
                cityCache.set("city", list);
                return res.status(200).json({ error: false, message: "City list successfully found", data: list });
            } else {
                return res.status(200).json({ error: true, message: "City list not found", data: null });
            }
        } else {
            return res.status(200).json({ error: false, message: "City list successfully found", data: list });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
}

// const up = async (rq,res) => {
//     try {
        
//     } catch (error) {
//         return res.status(500).json({ error: true, message: "Internal Server Error", data: error });
//     }
// }

module.exports = { addCity, listCity };