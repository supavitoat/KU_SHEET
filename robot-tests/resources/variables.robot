*** Variables ***
# จุดเชื่อมต่อ API
${AUTH_REGISTER}            /auth/register
${AUTH_LOGIN}               /auth/login
${AUTH_ME}                  /auth/me
${AUTH_LOGOUT}              /auth/logout
${AUTH_FORGOT_PASSWORD}     /auth/forgot-password
${AUTH_RESET_PASSWORD}      /auth/reset-password

${SHEETS_LIST}              /sheets
${SHEETS_SEARCH}            /sheets/search
${SHEETS_FEATURED}          /sheets/featured
${SHEETS_MY}                /sheets/my-sheets
${SHEETS_PURCHASED}         /sheets/purchased

# Seller endpoints (use singular '/seller' routes; backend also keeps a plural alias)
${SELLER_REGISTER}          /seller/register
${SELLER_PROFILE}           /seller/profile
${SELLER_SHEETS}            /seller/sheets
${SELLER_REVENUE}           /seller/revenue

${ORDERS_CREATE}            /orders
${ORDERS_LIST}              /orders
${ORDERS_STATS}             /orders/stats
${ORDERS_PURCHASED}         /orders/purchased-sheets

${PAYMENT_SESSION}          /payments/session
${PAYMENT_PROMPTPAY}        /payments/promptpay/create
${PAYMENT_VERIFY}           /payments/promptpay/verify

${GROUPS_LIST}              /groups
${GROUPS_MY}                /groups/me/list
${GROUPS_CREATE}            /groups

${WISHLIST_ADD}             /wishlist
${WISHLIST_GET}             /wishlist
${WISHLIST_REMOVE}          /wishlist

${REVIEWS_GET}              /reviews
${REVIEWS_CREATE}           /reviews

${NOTIFICATIONS_LIST}       /notifications
${NOTIFICATIONS_READ}       /notifications

${METADATA_FACULTIES}       /metadata/faculties
${METADATA_SUBJECTS}        /metadata/subjects
${METADATA_SHEET_TYPES}     /metadata/sheet-types
${METADATA_STATS}           /metadata/stats

# ข้อมูลทดสอบ (ใช้ข้อมูลจริงจากฐานข้อมูล)
${VALID_FACULTY}            คณะวิศวกรรมศาสตร์ กำแพงแสน
${VALID_SUBJECT}            222
${VALID_SHEET_TYPE}         สรุป
${VALID_TERM}               เทอมต้น
${VALID_YEAR}               2568
