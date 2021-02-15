import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  uuid: string;

  @Column("varchar")
  name: string;

  @Column("varchar", { unique: true })
  spotifyId: string;
}
