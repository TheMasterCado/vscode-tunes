import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Follower extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.following)
  user: User;

  @ManyToOne((type) => User, (user) => user.followers)
  followed: User;

  @Column("datetime")
  followedAt: Date;
}
