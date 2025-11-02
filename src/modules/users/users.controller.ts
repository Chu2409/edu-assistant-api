import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserReqDto } from './dto/req/create-user.dto'
import { UpdateUserReqDto } from './dto/req/update-user.dto'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ChangeUserStatusDto } from './dto/req/change-user-status.dto'
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/shared/decorators/api-standard-response.decorator'
import { UserPersonResDto } from './dto/res/user.dto'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
  })
  @ApiStandardResponse()
  create(@Body() dto: CreateUserReqDto) {
    return this.service.create(dto)
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
  })
  @ApiPaginatedResponse(UserPersonResDto, HttpStatus.OK)
  findAll(@Query() paginationDto: BaseParamsReqDto) {
    return this.service.findAll(paginationDto)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by id',
  })
  @ApiStandardResponse(UserPersonResDto, HttpStatus.OK)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user by id',
  })
  @ApiStandardResponse(UserPersonResDto, HttpStatus.OK)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserReqDto) {
    return this.service.update(id, dto)
  }

  @Patch('change-status/:id')
  @ApiOperation({
    summary: 'Change the status of a user by id',
  })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserStatusDto,
  ) {
    return this.service.changeStatus(id, dto)
  }
}
