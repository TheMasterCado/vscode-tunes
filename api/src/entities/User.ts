import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Follower } from "./Follower";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  uuid: string;

  @Column("varchar")
  name: string;

  @Column("varchar", { nullable: true })
  currentlyPlayingName: string;

  @Column("varchar", { nullable: true })
  currentlyPlayingUri: string;

  @Column("datetime", { nullable: true })
  currentlyPlayingAt: Date;

  @Column("varchar", { unique: true })
  spotifyId: string;

  @OneToMany((type) => Follower, (follower) => follower.user)
  following: User;

  @OneToMany((type) => Follower, (user) => user.followed)
  followers: User;
}
