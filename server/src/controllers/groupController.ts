import type { NextFunction, Request, Response } from "express";
import { FilterQuery, Types } from "mongoose";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/httpErrors";
import type { GroupDocument } from "../models/group";
import GroupModel from "../models/group";
import { validateCreateGroupBody, validateGroupQueryParams } from "../validators/groupValidators";
import statsService from "../services/statsService";

interface SerializedGroup {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  memberIds: string[];
  university: string;
  createdAt: Date;
  updatedAt: Date;
}

const serializeGroup = (group: GroupDocument): SerializedGroup => ({
  id: group.id,
  name: group.name,
  description: group.description ?? null,
  ownerId: group.owner.toString(),
  memberIds: group.members.map((member) => member.toString()),
  university: group.university,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
});

const ensureValidGroupId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid group id");
  }

  return new Types.ObjectId(id);
};

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = validateGroupQueryParams(req.query);

    const filter: FilterQuery<GroupDocument> = {};

    if (params.search) {
      filter.$text = { $search: params.search };
    }

    if (params.university) {
      filter.university = params.university;
    }

    if (params.ownerId) {
      filter.owner = new Types.ObjectId(params.ownerId);
    }

    if (params.memberId) {
      filter.members = new Types.ObjectId(params.memberId);
    }

    const groups = await GroupModel.find(filter).sort({ createdAt: -1 }).exec();

    res.status(200).json({ groups: groups.map(serializeGroup) });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = ensureValidGroupId(req.params.id);

    const group = await GroupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    res.status(200).json({ group: serializeGroup(group) });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const data = validateCreateGroupBody(req.body);

    const ownerId = new Types.ObjectId(user.id);

    const group = await GroupModel.create({
      name: data.name,
      description: data.description,
      owner: ownerId,
      university: data.university,
      members: [],
    });

    try {
      await statsService.incrementGroupsCreated();
    } catch (statsError) {
      console.error("Failed to increment groups created metric", statsError);
    }

    res.status(201).json({ group: serializeGroup(group) });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const groupId = ensureValidGroupId(req.params.id);
    const userId = new Types.ObjectId(user.id);

    const group = await GroupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    if (group.owner.equals(userId)) {
      throw new ConflictError("Group owners are already members");
    }

    const alreadyMember = group.members.some((member) => member.equals(userId));

    if (alreadyMember) {
      throw new ConflictError("User has already joined this group");
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({ group: serializeGroup(group) });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const groupId = ensureValidGroupId(req.params.id);
    const userId = new Types.ObjectId(user.id);

    const group = await GroupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    if (group.owner.equals(userId)) {
      throw new ConflictError("Group owners cannot leave their own group");
    }

    const isMember = group.members.some((member) => member.equals(userId));

    if (!isMember) {
      throw new ConflictError("User is not a member of this group");
    }

    const updatedMembers = group.members.filter((member) => !member.equals(userId));
    group.set("members", updatedMembers);
    await group.save();

    res.status(200).json({ group: serializeGroup(group) });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const groups = await GroupModel.find({
      $or: [{ owner: user._id }, { members: user._id }],
    })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({ groups: groups.map(serializeGroup) });
  } catch (error) {
    next(error);
  }
};
