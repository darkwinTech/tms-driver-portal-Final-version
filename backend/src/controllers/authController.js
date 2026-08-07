import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../data/index.js';
import { comparePassword, hashPassword, signToken, sanitizeUser } from '../services/authService.js';
import { USER_ROLES } from '../utils/constants.js';
import { isCompanyEmail, isValidPhone } from '../utils/validators.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const user = email ? await userRepository.findByEmail(email) : null;

  if (!user || !user.isActive || !(await comparePassword(password || '', user.passwordHash))) {
    throw new ApiError('Invalid credentials', 401);
  }
  if (user.accountStatus === 'Pending') {
    throw new ApiError('Your registration is pending approval by Operations.', 403);
  }
  if (user.accountStatus === 'Rejected') {
    throw new ApiError('Your registration was not approved. Contact Operations for details.', 403);
  }

  const sanitized = sanitizeUser(user);
  res.json({ token: signToken(user), user: sanitized });
}

// Self-service signup for transporter companies - creates the account as
// Pending, no token issued, so it can't be used to log in until an
// Operations Manager approves it (see userController.approveUser).
export async function registerTransporter(req, res) {
  const { firstName, lastName, phone, companyName, companyEmail, contractNumber, password } = req.body;

  if (!firstName || !lastName || !phone || !companyName || !companyEmail || !contractNumber || !password) {
    throw new ApiError('firstName, lastName, phone, companyName, companyEmail, contractNumber, and password are required');
  }
  if (!isValidPhone(phone)) {
    throw new ApiError('Please provide a valid mobile number (e.g. 05XXXXXXXX)');
  }
  if (!isCompanyEmail(companyEmail)) {
    throw new ApiError('Please provide a valid company email address (personal email providers are not accepted)');
  }
  if (password.length < 8) {
    throw new ApiError('Password must be at least 8 characters');
  }
  if (await userRepository.findByEmail(companyEmail)) {
    throw new ApiError('A user with this email already exists');
  }

  await userRepository.create({
    fullName: `${firstName} ${lastName}`.trim(),
    email: companyEmail.toLowerCase().trim(),
    role: 'Requester',
    isActive: true,
    passwordHash: await hashPassword(password),
    companyName,
    contractNumber,
    accountStatus: 'Pending',
  });

  res.status(201).json({ message: 'Registration submitted. You will be notified by email once Operations reviews it.' });
}

export async function register(req, res) {
  const { employeeId, fullName, email, password, roleName, department, managerId } = req.body;

  if (!employeeId || !fullName || !email || !password || !roleName || !department) {
    throw new ApiError('employeeId, fullName, email, password, roleName, and department are required');
  }
  if (!USER_ROLES.includes(roleName)) {
    throw new ApiError(`Unknown role: ${roleName}`);
  }
  if (await userRepository.findByEmail(email)) {
    throw new ApiError('A user with this email already exists');
  }

  const user = await userRepository.create({
    employeeId,
    fullName,
    email: email.toLowerCase().trim(),
    department,
    role: roleName,
    managerId: managerId || null,
    isActive: true,
    passwordHash: await hashPassword(password),
  });

  const sanitized = sanitizeUser(user);
  res.status(201).json({ token: signToken(user), user: sanitized });
}

export async function me(req, res) {
  res.json({ user: req.user });
}


 