"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /companies
 * Retrieves a list of companies filtered by specified criteria.
 * 
 * This method allows for filtering based on partial name matches, minimum number of employees,
 * and maximum number of employees, with all filters being optional. It performs a case-insensitive
 * search for names. If multiple filters are provided, they are combined with an AND logical operator.
 * 
 * Parameters:
 *   - name: String (optional)
 *     A substring to search for within the company name. The search is case-insensitive.
 *   - minEmployees: Integer (optional)
 *     The minimum number of employees a company must have to be included in the results.
 *   - maxEmployees: Integer (optional)
 *     The maximum number of employees a company can have to be included in the results.
 *     Throws an error if `minEmployees` is greater than `maxEmployees`.
 * 
 * Returns:
 *   - An array of objects where each object represents a company and includes:
 *     - handle: String - The unique identifier for the company.
 *     - name: String - The name of the company.
 *     - description: String - A brief description of the company.
 *     - numEmployees: Integer - The number of employees at the company.
 *     - logoUrl: String - The URL to the company's logo.
 * 
 * Throws:
 *   - An error if `minEmployees` is set higher than `maxEmployees`.
 * 
 * Example:
 *   findAll('Tech', 50, 500) // returns companies with 'Tech' in their name, having 50 to 500 employees.
 *   findAll() // returns all companies.
 */

router.get("/", async function (req, res, next) {
  try {
    const { name } = req.query;
    let { minEmployees, maxEmployees } = req.query;

    minEmployees = minEmployees ? Number(minEmployees) : undefined;
    maxEmployees = maxEmployees ? Number(maxEmployees) : undefined;

    if (minEmployees !== undefined && maxEmployees !== undefined && minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees must be less than maxEmployees");
    }

    const companies = await Company.findAll(name, minEmployees, maxEmployees);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
