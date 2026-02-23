import fs from "node:fs";
import path from "node:path";
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

interface SessionAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionCreationAttributes
  extends Optional<SessionAttributes, "id" | "createdAt" | "updatedAt"> {}

interface ReminderAttributes {
  id: number;
  userId: number;
  title: string;
  note: string;
  remindAt: Date | null;
  isCompleted: boolean;
  sharedToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReminderCreationAttributes
  extends Optional<
    ReminderAttributes,
    | "id"
    | "note"
    | "remindAt"
    | "isCompleted"
    | "sharedToken"
    | "createdAt"
    | "updatedAt"
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class Session
  extends Model<SessionAttributes, SessionCreationAttributes>
  implements SessionAttributes
{
  declare id: number;
  declare userId: number;
  declare token: string;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class Reminder
  extends Model<ReminderAttributes, ReminderCreationAttributes>
  implements ReminderAttributes
{
  declare id: number;
  declare userId: number;
  declare title: string;
  declare note: string;
  declare remindAt: Date | null;
  declare isCompleted: boolean;
  declare sharedToken: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var __sequelize: Sequelize | undefined;
  // eslint-disable-next-line no-var
  var __dbReady: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __modelsReady: boolean | undefined;
}

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const storagePath = path.join(dataDir, "app.sqlite");

export const sequelize =
  global.__sequelize ??
  new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__sequelize = sequelize;
}

function initModels(): void {
  if (global.__modelsReady) {
    return;
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
    },
  );

  Session.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Session",
      tableName: "sessions",
    },
  );

  Reminder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      remindAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sharedToken: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Reminder",
      tableName: "reminders",
    },
  );

  User.hasMany(Session, {
    foreignKey: "userId",
    as: "sessions",
    onDelete: "CASCADE",
  });
  Session.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasMany(Reminder, {
    foreignKey: "userId",
    as: "reminders",
    onDelete: "CASCADE",
  });
  Reminder.belongsTo(User, { foreignKey: "userId", as: "user" });

  global.__modelsReady = true;
}

export async function initDatabase(): Promise<void> {
  initModels();

  if (!global.__dbReady) {
    global.__dbReady = (async () => {
      await sequelize.authenticate();
      await sequelize.sync();
    })().catch((error) => {
      global.__dbReady = undefined;
      throw error;
    });
  }

  await global.__dbReady;
}
