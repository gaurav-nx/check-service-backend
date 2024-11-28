const addroleschema = require('../model/addrole.modal')
const jwt = require('jsonwebtoken');

const employeelogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === '' || password === '') {
            const missingFields = [];
            if (email === '') missingFields.push('Email');
            if (password === '') missingFields.push('Password');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).json({ error: true, message: `${error}`, data: null })
        } else {
            const user = await addroleschema.findOne({ email });
            console.log(user);
            
            if (user == null) {
                return res.status(200).json({ error: true, message: "Incorrect Email", data: null })
            }
            if (password !== user.password) {
                return res.status(200).json({ error: true, message: "Incorrect Password", data: null })
            }
            if (user.status == 0) {
                return res.status(200).json({ error: true, message: 'Access denied for login. Please contact the administrator for assistance.', data: null });
            }
            if (user.job_role == "Sales") {
                const SalesToken = jwt.sign({ userId: user._id, role: user.job_role }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['SalesToken']: SalesToken })
            } else if (user.job_role == "Filing Manager") {
                const FilingManagerToken = jwt.sign({ userId: user._id, role: user.job_role }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['FilingManagerToken']: FilingManagerToken })
            } else if (user.job_role == "Pre-Sales") {
                const Pre_SalesToken = jwt.sign({ userId: user._id, role: user.job_role }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['Pre_SalesToken']: Pre_SalesToken })
            } else if (user.job_role == "Filing Team") {
                const FilingTeamToken = jwt.sign({ userId: user._id, role: user.job_role }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['FilingTeamToken']: FilingTeamToken })
            } else if (user.job_role == "Influencer") {
                const InfluencerToken = jwt.sign({ userId: user._id, role: user.job_role }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['InfluencerToken']: InfluencerToken })
            } else {
                const Admintoken = jwt.sign({ userId: user._id }, 'secretKey');
                return res.status(200).json({ error: false, message: "Successfully Login", ['Admintoken']: Admintoken })
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const empProfile = async (req, res) => {
    try {
        const { _id } = req.body;
        if (_id === '') {
            return res.status(200).json({ error: true, message: "Please provide the id", data: null });
        } else {
            const user = await addroleschema.findOne({ _id });
            if (user == null) {
                return res.status(200).json({ error: true, message: "employee profile not found", data: null });
            } else {
                return res.status(200).json({ error: false, message: "Susccessfully profile find", data: user });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to find employee profile", data: null });
    }
};

module.exports = { employeelogin, empProfile }