const NodeCache = require("node-cache");
const stateCache = new NodeCache();
const stateSchema = require('../model/state.modal');
const States = require('country-state-city').State;

const addState = async (req, res) => {
    try {
        const states = States.getAllStates(); // Assuming Countrys is an object containing countries data
        for (const state of states) {
            const newState = new stateSchema({
                name: state.name,
                short_name: state.isoCode, // Assuming isoCode holds the short name
                country_code: state.countryCode
            });
            await newState.save();
        }
        return res.status(200).json({ error: false, message: "States added successfully", data: null });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: true, message: "Internal Server error", data: null });
    }
};

const listState = async (req, res) => {
    try {
        let list = stateCache.get("states");
        if (!list) {
            list = await stateSchema.find(); // Fetch countries from the database if not found in cache
            if (list && list.length > 0) {
                stateCache.set("states", list);
                return res.status(200).json({ error: false, message: "States list successfully found", data: list });
            } else {
                return res.status(200).json({ error: true, message: "States list not found", data: null });
            }
        } else {
            return res.status(200).json({ error: false, message: "States list successfully found", data: list });
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null })
    }
};

const findByCountryCode = async (req, res) => {
    try {
        const { country_code } = req.body;
        if (!country_code) {
            return res.status(200).json({ error: true, message: "Please select the country", data: null });
        } else {
            const find = await stateSchema.find({ country_code: country_code });
            if (!find) {
                return res.status(200).json({ error: true, message: "State not found", data: null });
            } else {
                return res.status(200).json({ error: false, message: "State successfully found", data: find });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

module.exports = { addState, listState, findByCountryCode };