// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/common.enums'

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: Object })
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, select: false })
  refreshToken?: string;

  @Prop()
  lastLogin?: Date;

  // Virtual para nombre completo
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Virtual para fullName
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Configurar toJSON para incluir virtuals
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).password;
    delete (ret as any).refreshToken;
    delete (ret as any).__v;
    return ret;
  },
});