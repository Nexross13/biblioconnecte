const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const friendshipModel = require('../models/friendshipModel');
const {
  sendFriendRequestNotification,
  sendFriendAcceptedNotification,
} = require('../services/emailService');
const libraryModel = require('../models/libraryModel');
const {
  getUsers: getMockUsers,
  getUserById: getMockUserById,
  getFriendsOfUser,
  setUserRole: setMockUserRole,
  setUserBypassPermission: setMockUserBypassPermission,
} = require('../data/mockData');
const { PRIMARY_FRONTEND_ORIGIN } = require('../config/frontend');
const { normalizeLoginInput, isLoginFormatValid } = require('../utils/login');
const { normalizeRole } = require('../utils/roles');

const FRONTEND_BASE = PRIMARY_FRONTEND_ORIGIN.replace(/\/$/, '');

const normalizeBooleanInput = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
    return null;
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return null;
  }
  return null;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const listUsers = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const users = getMockUsers();
      return res.json({ users });
    }
    const users = await userModel.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const mockUser = getMockUserById(req.params.id);
      if (!mockUser) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      return res.json({ user: mockUser });
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const ensureSelfAction = (req, targetId) => {
  if (Number(req.user.id) !== Number(targetId)) {
    const error = new Error('You are not allowed to perform this action');
    error.status = 403;
    throw error;
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    const desiredRole = normalizeRole(req.body?.role);
    if (!desiredRole) {
      const err = new Error('Invalid role value. Expected user, moderator or admin.');
      err.status = 400;
      throw err;
    }

    if (Number(targetId) === Number(req.user.id)) {
      const err = new Error('You cannot modify your own role.');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const updated = setMockUserRole(targetId, desiredRole);
      if (!updated) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      return res.json({ user: updated });
    }

    const updated = await userModel.updateUserRole(targetId, desiredRole);
    if (!updated) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
};

const updateBookProposalDerogation = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    const normalizedValue = normalizeBooleanInput(req.body?.canBypassBookProposals ?? req.body?.enabled);
    if (normalizedValue === null) {
      const err = new Error('Invalid boolean value for canBypassBookProposals');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const updated = setMockUserBypassPermission(targetId, normalizedValue);
      if (!updated) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      return res.json({ user: updated });
    }

    const updated = await userModel.setBookProposalDerogation(targetId, normalizedValue);
    if (!updated) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
};

const updateAuthorProposalDerogation = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      const err = new Error('Administrator privileges required');
      err.status = 403;
      throw err;
    }

    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    const normalizedValue = normalizeBooleanInput(
      req.body?.canBypassAuthorProposals ?? req.body?.enabled,
    );
    if (normalizedValue === null) {
      const err = new Error('Invalid boolean value for canBypassAuthorProposals');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const updated = setMockUserBypassPermission(
        targetId,
        normalizedValue,
        'canBypassAuthorProposals',
      );
      if (!updated) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      return res.json({ user: updated });
    }

    const updated = await userModel.setAuthorProposalDerogation(targetId, normalizedValue);
    if (!updated) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
};

const listFriends = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);
    if (process.env.USE_MOCKS === 'true') {
      const friends = getFriendsOfUser(userId);
      return res.json({ friends });
    }
    const friends = await friendshipModel.listFriends(userId);
    res.json({ friends });
  } catch (error) {
    next(error);
  }
};

const requestFriend = async (req, res, next) => {
  try {
    const requesterId = Number(req.user.id);
    const addresseeId = Number(req.params.id);

    if (!Number.isInteger(addresseeId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (requesterId === addresseeId) {
      const err = new Error('You cannot befriend yourself');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        friendship: {
          requesterId,
          addresseeId,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
      });
    }

    const addressee = await userModel.findById(addresseeId);
    if (!addressee) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const friendship = await friendshipModel.createFriendRequest({ requesterId, addresseeId });

    const requesterProfile = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      email: req.user.email,
    };

    sendFriendRequestNotification({
      addressee,
      requester: requesterProfile,
      dashboardUrl: `${FRONTEND_BASE}/friends`,
    }).catch((emailError) => {
      console.error('📨  Unable to send friend request email:', emailError.message);
    });

    res.status(201).json({ friendship });
  } catch (error) {
    next(error);
  }
};

const acceptFriend = async (req, res, next) => {
  try {
    const addresseeId = Number(req.params.id);
    const requesterId = Number(req.params.friendId);
    if (!Number.isInteger(addresseeId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, addresseeId);

    if (!Number.isInteger(requesterId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.json({
        friendship: {
          requesterId,
          addresseeId,
          status: 'accepted',
          requestedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        },
      });
    }

    const [friendship, requester, addressee] = await Promise.all([
      friendshipModel.acceptFriendRequest({ requesterId, addresseeId }),
      userModel.findById(requesterId),
      userModel.findById(addresseeId),
    ]);
    if (!friendship) {
      const err = new Error('Friend request not found');
      err.status = 404;
      throw err;
    }

    if (requester && addressee) {
      const requesterProfile = {
        firstName: requester.firstName,
        lastName: requester.lastName,
        email: requester.email,
      };
      const addresseeProfile = {
        firstName: addressee.firstName,
        lastName: addressee.lastName,
        email: addressee.email,
      };

      sendFriendAcceptedNotification({
        requester: requesterProfile,
        addressee: addresseeProfile,
        dashboardUrl: `${FRONTEND_BASE}/friends`,
      }).catch((emailError) => {
        console.error('📨  Unable to send friend acceptance email:', emailError.message);
      });
    }

    res.json({ friendship });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const friendId = Number(req.params.friendId);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);

    if (!Number.isInteger(friendId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }

    const deleted = await friendshipModel.removeFriendship({ userId, friendId });
    if (!deleted) {
      const err = new Error('Friendship not found');
      err.status = 404;
      throw err;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const listFriendRequests = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);

    if (process.env.USE_MOCKS === 'true') {
      const { getFriendships, getUserById } = require('../data/mockData');
      const incoming = getFriendships()
        .filter((friendship) => friendship.status === 'pending' && friendship.addresseeId === userId)
        .map((friendship) => {
          const requester = getUserById(friendship.requesterId);
          return requester
            ? {
                requesterId: requester.id,
                login: requester.login,
                firstName: requester.firstName,
                lastName: requester.lastName,
                email: requester.email,
                requestedAt: friendship.requestedAt,
              }
            : null;
        })
        .filter(Boolean);
      return res.json({ requests: incoming });
    }

    const requests = await friendshipModel.listIncomingRequests(userId);
    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

const listOutgoingFriendRequests = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    ensureSelfAction(req, userId);

    if (process.env.USE_MOCKS === 'true') {
      const { getFriendships, getUserById } = require('../data/mockData');
      const outgoing = getFriendships()
        .filter((friendship) => friendship.status === 'pending' && friendship.requesterId === userId)
        .map((friendship) => {
          const addressee = getUserById(friendship.addresseeId);
          return addressee
            ? {
                addresseeId: addressee.id,
                login: addressee.login,
                firstName: addressee.firstName,
                lastName: addressee.lastName,
                email: addressee.email,
                requestedAt: friendship.requestedAt,
              }
            : null;
        })
        .filter(Boolean);
      return res.json({ requests: outgoing });
    }

    const requests = await friendshipModel.listOutgoingRequests(userId);
    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

const ensureFriendshipOrSelf = async (authUserId, targetUserId) => {
  if (Number(authUserId) === Number(targetUserId)) {
    return true;
  }

  if (process.env.USE_MOCKS === 'true') {
    const { getFriendsOfUser } = require('../data/mockData');
    return getFriendsOfUser(authUserId).some((friend) => Number(friend.id) === Number(targetUserId));
  }

  return friendshipModel.isAcceptedFriend({ userId: authUserId, friendId: targetUserId });
};

const rejectFriend = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const friendId = Number(req.params.friendId);

    if (!Number.isInteger(userId) || !Number.isInteger(friendId)) {
      const err = new Error('Invalid identifier');
      err.status = 400;
      throw err;
    }

    ensureSelfAction(req, userId);

    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }

    await friendshipModel.removeFriendship({ userId, friendId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getUserLibrary = async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    const isAllowed = await ensureFriendshipOrSelf(req.user.id, targetUserId);
    if (!isAllowed) {
      const err = new Error('Only friends can view this library');
      err.status = 403;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const { getLibraryItems } = require('../data/mockData');
      return res.json({ books: getLibraryItems(targetUserId) });
    }

    const books = await libraryModel.listLibraryBooks(targetUserId);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const getUserWishlist = async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }

    const isAllowed = await ensureFriendshipOrSelf(req.user.id, targetUserId);
    if (!isAllowed) {
      const err = new Error('Only friends can view this wishlist');
      err.status = 403;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      const { getWishlistItems } = require('../data/mockData');
      return res.json({ books: getWishlistItems(targetUserId) });
    }

    const books = await libraryModel.listWishlistBooks(targetUserId);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);

    const firstName = req.body?.firstName?.trim();
    const lastName = req.body?.lastName?.trim();
    const loginInput = normalizeLoginInput(req.body?.login);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const passwordInput = typeof req.body?.password === 'string' ? req.body.password : undefined;
    const trimmedPassword = passwordInput?.trim();
    const rawDateOfBirth = req.body?.dateOfBirth ?? req.body?.date_naissance;
    const dateOfBirth = normalizeDate(rawDateOfBirth);

    if (!firstName || !lastName || !email || !loginInput) {
      const err = new Error('firstName, lastName, login and email are required');
      err.status = 400;
      throw err;
    }

    if (!isLoginFormatValid(loginInput)) {
      const err = new Error('Login must contain 3 to 30 characters using letters, numbers, dots, hyphens or underscores');
      err.status = 400;
      throw err;
    }

    if (trimmedPassword && trimmedPassword.length < 8) {
      const err = new Error('Password must contain at least 8 characters');
      err.status = 400;
      throw err;
    }

    if (rawDateOfBirth && !dateOfBirth) {
      const err = new Error('Invalid date_of_birth format');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.json({
        user: {
          id: userId,
          login: loginInput,
          firstName,
          lastName,
          email,
          dateOfBirth,
          createdAt: new Date().toISOString(),
        },
      });
    }

    const existingLogin = await userModel.findByLogin(loginInput);
    if (existingLogin && Number(existingLogin.id) !== Number(userId)) {
      const err = new Error('Login already in use');
      err.status = 409;
      throw err;
    }

    const updatedUser = await userModel.updateUser(userId, {
      login: loginInput,
      firstName,
      lastName,
      email,
      dateOfBirth,
    });

    if (trimmedPassword) {
      const passwordHash = await bcrypt.hash(trimmedPassword, 10);
      await userModel.updateUserPassword(userId, passwordHash);
    }

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  listFriends,
  listFriendRequests,
  listOutgoingFriendRequests,
  updateUserRole,
  setBookProposalDerogation: updateBookProposalDerogation,
  setAuthorProposalDerogation: updateAuthorProposalDerogation,
  requestFriend,
  acceptFriend,
  removeFriend,
  rejectFriend,
  updateProfile,
  getUserLibrary,
  getUserWishlist,
};
