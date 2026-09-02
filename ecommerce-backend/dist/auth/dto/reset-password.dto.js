var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
export class ResetPasswordDto {
    email;
    otpCode;
    newPassword;
}
__decorate([
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(6, 6, { message: 'OTP must be exactly 6 digits' }),
    Matches(/^\d{6}$/, { message: 'OTP must contain only digits' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "otpCode", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    Length(8, 100, { message: 'Password must be between 8 and 100 characters long' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=reset-password.dto.js.map