import { JwtPayload } from './types';
export declare const generateToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JwtPayload;
//# sourceMappingURL=jwt.util.d.ts.map