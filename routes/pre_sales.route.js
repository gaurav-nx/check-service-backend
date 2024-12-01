var express = require('express')
const presales = express.Router();
const { singleUpload } = require('../middleware/multer')
const { otherNoeDataGet,otherNotesLeadUpdate, AddLead, GetAllLead, allLeadCount, preSalesFreshCount, listAllLeads, UpdateLead, leadUpdateById, GetAllFillinfManager, GetAllFillinfTeam, GetAllLeadSAleRole, getFillingManagerLead, getFillingTeamLead, DeleteLead, GetByIdLead, GetAllSales, UpdateLeadAssign, fillingManagerLeadAssign, UpdateLeadAssignprocess, updatefilingteam, updateTermCondition, leadUnclose, deletePaymentById, leaderBoard, getLeadstatusCount, getLeadStatus, getLeadTodayCount, getLeadFillingManagerCount, getLeadFillingManager, getLeadFillingCaseCount, getLeadFillingCase, getRevenueBoardCount, getAdminRevenueBoardCount, getRevenueBoardLead, getAnalyticsCount, getAnalyticsLeads, getCaseTodayCount, getCaseTodayLead, UpdateStatus, LeadsTransfer } = require('../controllers/lead.controller')

presales.post('/AddLead', singleUpload, AddLead);
presales.get('/GetAllLead', GetAllLead);
presales.get('/all-leadcount', allLeadCount);
presales.get('/presales-freshleadcount', preSalesFreshCount);
presales.get('/list-allleads', listAllLeads);
presales.post('/UpdateLead', singleUpload, UpdateLead);
presales.post('/lead-updatebyid', singleUpload, leadUpdateById);
presales.post('/DeleteLead', DeleteLead)
presales.post('/GetByIdLead', GetByIdLead)
presales.get('/GetAllSales', GetAllSales)
presales.post('/GetAllLeadSAleRole', GetAllLeadSAleRole)
presales.post('/getfilling-managerlead', getFillingManagerLead);
presales.get('/GetAllFillinfManager', GetAllFillinfManager);
presales.post('/getfilling-teamlead', getFillingTeamLead);
presales.get('/GetAllFillinfTeam', GetAllFillinfTeam)
presales.post('/UpdateLeadAssign', UpdateLeadAssign)
presales.post('/fillingmanager-leadassign', fillingManagerLeadAssign)
presales.post('/UpdateLeadAssignprocess', UpdateLeadAssignprocess)
presales.post('/updatefilingteam', updatefilingteam);
presales.post('/update-termcondition', updateTermCondition);
presales.post('/lead-unclose', leadUnclose);
presales.post('/deletepayment-byid', deletePaymentById);
presales.post('/leader-board', leaderBoard);
presales.post('/getlead-statuscount', getLeadstatusCount);
presales.get('/getlead-status', getLeadStatus);
presales.get('/getlead-todaycount', getLeadTodayCount);
presales.get('/getlead-fillingmanagerCount', getLeadFillingManagerCount);
presales.get('/getlead-fillingmanager', getLeadFillingManager);
presales.get('/getlead-fillingcasecount', getLeadFillingCaseCount);
presales.get('/getlead-fillingcase', getLeadFillingCase);
presales.get('/getrevenue-boardcount', getRevenueBoardCount);
presales.get('/getadminrevenue-boardcount', getAdminRevenueBoardCount);
presales.get('/getrevenue-boardlead', getRevenueBoardLead);
presales.get('/getanalytics-count', getAnalyticsCount);
presales.get('/getanalytics-leads', getAnalyticsLeads);
presales.post('/getcase-todaycount', getCaseTodayCount);
presales.post('/getcase-todaylead', getCaseTodayLead);
presales.post('/getcase-notesUpdate', otherNotesLeadUpdate);
presales.get('/getcasenote', otherNoeDataGet);

presales.put('/visarefusal-update-status', UpdateStatus);
presales.put('/transfer-leads', LeadsTransfer);

module.exports = presales;
