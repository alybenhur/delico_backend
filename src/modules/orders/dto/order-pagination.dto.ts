// src/modules/orders/dto/order-pagination.dto.ts
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/common.enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class OrderPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ 
    enum: OrderStatus,
    description: 'Filtrar por estado del pedido',
    example: OrderStatus.PENDING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}