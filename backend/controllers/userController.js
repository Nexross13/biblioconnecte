const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const friendshipModel = require('../models/friendshipModel');
const libraryModel = require('../models/libraryModel');
const {
  getUsers: getMockUsers,
  getUserById: getMockUserById,
  getFriendsOfUser,
} = require('../data/mockData');

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

    const friendship = await friendshipModel.createFriendRequest({ requesterId, addresseeId });
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

    const friendship = await friendshipModel.acceptFriendRequest({ requesterId, addresseeId });
    if (!friendship) {
      const err = new Error('Friend request not found');
      err.status = 404;
      throw err;
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
    const email = req.body?.email?.trim();
    const passwordInput = typeof req.body?.password === 'string' ? req.body.password : undefined;
    const trimmedPassword = passwordInput?.trim();
    const rawDateOfBirth = req.body?.dateOfBirth ?? req.body?.date_naissance;
    const dateOfBirth = normalizeDate(rawDateOfBirth);

    if (!firstName || !lastName || !email) {
      const err = new Error('firstName, lastName and email are required');
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
          firstName,
          lastName,
          email,
          dateOfBirth,
          createdAt: new Date().toISOString(),
        },
      });
    }

    const updatedUser = await userModel.updateUser(userId, {
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
  requestFriend,
  acceptFriend,
  removeFriend,
  rejectFriend,
  updateProfile,
  getUserLibrary,
  getUserWishlist,
};
