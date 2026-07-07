import { Param, ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = (name: string) => Param(name, ParseUUIDPipe);
