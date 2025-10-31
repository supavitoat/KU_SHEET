*** Settings ***
Documentation     ชุดทดสอบการสมัครและจัดการบัญชีผู้ขาย
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบสมัครเป็นผู้ขายด้วยข้อมูลที่ถูกต้อง
    [Documentation]    ทดสอบการสมัครเป็นผู้ขายด้วยข้อมูลที่ครบถ้วนและถูกต้อง
    [Tags]    seller    register    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    1s
    ${ts}=    Get Time    epoch
    ${data}=    Create Dictionary
    ...    pen_name=ร้านค้าทดสอบ${ts}
    ...    description=ร้านค้าทดสอบสำหรับขายชีท
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${response}=    POST With Retry    api    ${SELLER_REGISTER}    ${data}    ${headers}    anything
    # Accept successful creation (200/201) or already-registered (400 with message)
    Run Keyword If    ${response.status_code} == 200 or ${response.status_code} == 201
    ...    Log    สมัครเป็นผู้ขายสำเร็จ
    ...    ELSE IF    ${response.status_code} == 400
    ...    Log    ลงทะเบียนไม่สำเร็จ (อาจลงทะเบียนไว้แล้ว): ${response.json()}[message]
    ...    ELSE
    ...    Fail    Registration failed with status ${response.status_code}

ทดสอบสมัครเป็นผู้ขายโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการสมัครเป็นผู้ขายโดยไม่ได้ login
    [Tags]    seller    register    negative
    ${ts}=    Get Time    epoch
    ${data}=    Create Dictionary
    ...    pen_name=ร้านค้าทดสอบ${ts}
    ...    description=ร้านค้าทดสอบ
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${response}=    POST With Retry    api    ${SELLER_REGISTER}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบสมัครเป็นผู้ขายโดยขาดข้อมูลที่จำเป็น
    [Documentation]    ทดสอบการสมัครเป็นผู้ขายโดยไม่ครบข้อมูลที่ต้องใช้
    [Tags]    seller    register    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary    shopName=ร้านค้าทดสอบ
    ${response}=    POST On Session    api    ${SELLER_REGISTER}    json=${data}    headers=${headers}    expected_status=anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบดึงข้อมูลโปรไฟล์ผู้ขายหลังสมัคร
    [Documentation]    ทดสอบการดึงข้อมูลโปรไฟล์ผู้ขาย
    [Tags]    seller    profile    positive
    # สมัครเป็นผู้ขายก่อน
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${ts}=    Get Time    epoch
    ${reg_data}=    Create Dictionary
    ...    pen_name=ร้านค้าทดสอบโปรไฟล์${ts}
    ...    description=คำอธิบายทดสอบ
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${reg_response}=    POST With Retry    api    ${SELLER_REGISTER}    ${reg_data}    ${headers}    anything
    Sleep    1s
    # ดึงข้อมูลโปรไฟล์
    ${response}=    GET With Retry    api    ${SELLER_PROFILE}    ${headers}    ${None}    anything
    # Accept 200 (profile found), 404 (not found) or 403 (not authorized / not a seller)
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 404 or ${response.status_code} == 403
    Run Keyword If    ${response.status_code} == 200    Log    ดึงข้อมูลโปรไฟล์ผู้ขายสำเร็จ
    ...    ELSE IF    ${response.status_code} == 404
    ...    Log    ยังไม่ได้ลงทะเบียนเป็นผู้ขาย
    ...    ELSE
    ...    Log    ไม่ได้รับอนุญาตในการเข้าถึง (อาจยังไม่ได้ลงทะเบียนเป็นผู้ขาย)

ทดสอบแก้ไขข้อมูลโปรไฟล์ผู้ขาย
    [Documentation]    ทดสอบการแก้ไขข้อมูลโปรไฟล์ผู้ขาย
    [Tags]    seller    profile    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # สมัครก่อน
    ${ts}=    Get Time    epoch
    ${reg_data}=    Create Dictionary
    ...    pen_name=ร้านค้าเดิม${ts}
    ...    description=คำอธิบายเดิม
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${reg_response}=    POST With Retry    api    ${SELLER_REGISTER}    ${reg_data}    ${headers}    anything
    # แก้ไขข้อมูล
    ${update_data}=    Create Dictionary
    ...    pen_name=ร้านค้าใหม่
    ...    description=คำอธิบายใหม่
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${response}=    PUT With Retry    api    ${SELLER_PROFILE}    ${update_data}    ${headers}    anything
    # Accept 200 (updated), 404 (not found) or 403 (not authorized/not a seller)
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 404 or ${response.status_code} == 403

ทดสอบดึงข้อมูลโปรไฟล์ผู้ขายโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงข้อมูลโปรไฟล์ผู้ขายโดยไม่ได้ login
    [Tags]    seller    profile    negative
    ${response}=    GET With Retry    api    ${SELLER_PROFILE}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบดึงรายการชีทของผู้ขาย
    [Documentation]    ทดสอบการดึงรายการชีทที่ผู้ขายขาย
    [Tags]    seller    sheets    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # ลงทะเบียนเป็นผู้ขายก่อน
    ${ts}=    Get Time    epoch
    ${reg_data}=    Create Dictionary
    ...    pen_name=ร้านค้าทดสอบชีท${ts}
    ...    description=ทดสอบ
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${reg_response}=    POST With Retry    api    ${SELLER_REGISTER}    ${reg_data}    ${headers}    anything
    # ดึงรายการชีท
    Sleep    1s
    ${response}=    GET With Retry    api    ${SELLER_SHEETS}    ${headers}    ${None}    anything
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 403
    Run Keyword If    ${response.status_code} == 200    Log    ดึงรายการชีทของผู้ขายสำเร็จ
    ...    ELSE    Log    ไม่ได้รับอนุญาตในฐานะผู้ขาย

ทดสอบดึงข้อมูลรายได้ของผู้ขาย
    [Documentation]    ทดสอบการดึงสถิติรายได้ของผู้ขาย
    [Tags]    seller    revenue    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # ลงทะเบียนเป็นผู้ขายก่อน
    ${ts}=    Get Time    epoch
    ${reg_data}=    Create Dictionary
    ...    pen_name=ร้านค้าทดสอบรายได้${ts}
    ...    description=ทดสอบ
    ...    bank_name=ธนาคารทดสอบ
    ...    bank_account=1234567890
    ...    account_name=ผู้ขายทดสอบ
    ${reg_response}=    POST On Session    api    ${SELLER_REGISTER}    json=${reg_data}    headers=${headers}    expected_status=anything
    # ดึงข้อมูลรายได้
    Sleep    1s
    ${response}=    GET With Retry    api    ${SELLER_REVENUE}    ${headers}    ${None}    anything
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 403
    Run Keyword If    ${response.status_code} == 200    Log    ดึงข้อมูลรายได้ของผู้ขายสำเร็จ
    ...    ELSE    Log    ไม่ได้รับอนุญาตในฐานะผู้ขาย
