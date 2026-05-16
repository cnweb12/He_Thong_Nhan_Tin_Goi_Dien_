# Common Layer

Thu mục `common` chứa code dùng chung ở cấp ứng dụng, không thuộc riêng một module business nào.

## Mục đích

Đây là nơi nên đặt các thành phần:

- dùng chung giữa nhiều module
- không phụ thuộc vào một domain cụ thể
- không phải hạ tầng Mongo

## Các nhóm con hiện có

- `constants`
  Hằng số dùng chung
- `errors`
  Kiểu lỗi hoặc helper lỗi dùng lại được
- `response`
  Helper liên quan response HTTP
- `utils`
  Utility dùng chung không gắn với Mongo và không gắn với một module cụ thể

## Khi nào không nên đưa code vào đây

Nếu logic:

- chỉ dành cho `users`
- chỉ dành cho `messages`
- chỉ dành cho `auth`

thì nên để trong chính module đó.

## Quy ước

`common` là tầng dùng chung của app, không phải nơi gom bừa mọi helper.
