*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    String
Library    OperatingSystem
Library    DateTime

*** Variables ***
${BASE_URL}         http://localhost:3000
${API_URL}          http://localhost:5000/api
${BROWSER}          chrome
${TIMEOUT}          10s


# ข้อมูลผู้ใช้ทดสอบ
${TEST_EMAIL}       testuser@ku.th
${TEST_PASSWORD}    Test1234!
${TEST_NAME}        ผู้ใช้ทดสอบ

# ข้อมูลผู้ขาย
${SELLER_EMAIL}     seller@ku.th
${SELLER_PASSWORD}  Seller1234!

# ข้อมูลผู้ดูแลระบบ
${ADMIN_EMAIL}      admin@ku.th
${ADMIN_PASSWORD}   Admin1234!

*** Keywords ***
Setup Test Session
    [Documentation]    สร้าง HTTP session สำหรับการทดสอบ
    # Build headers dict so RequestsLibrary receives a proper mapping
    ${headers}=    Create Dictionary    X-Test-Run    1
    Create Session    api    ${API_URL}    headers=${headers}    verify=${False}
    Run Keyword And Ignore Error    Reset Rate Limits For Session

Teardown Test Session
    [Documentation]    ลบ HTTP sessions ทั้งหมด
    Delete All Sessions

Generate Random Email
    [Documentation]    สร้างอีเมลแบบสุ่มสำหรับการทดสอบ
    ${timestamp}=    Get Time    epoch
    ${random_email}=    Set Variable    testuser${timestamp}@ku.th
    RETURN    ${random_email}

Register Test User
    [Arguments]    ${email}=${TEST_EMAIL}    ${password}=${TEST_PASSWORD}    ${fullName}=ผู้ใช้ทดสอบ
    [Documentation]    สมัครผู้ใช้ทดสอบใหม่
    ${data}=    Create Dictionary
    ...    email=${email}
    ...    password=${password}
    ...    fullName=${fullName}
    ...    faculty=Engineering
    ...    major=Computer Engineering
    ...    year=3
    ${response}=    POST On Session    api    /auth/register    json=${data}    expected_status=anything
    RETURN    ${response}

Login User
    [Arguments]    ${email}=${TEST_EMAIL}    ${password}=${TEST_PASSWORD}
    [Documentation]    เข้าสู่ระบบและคืนค่า token
    ${data}=    Create Dictionary    email=${email}    password=${password}
    # Use POST With Retry to handle transient 429 rate-limit responses during local runs
    ${response}=    POST With Retry    api    /auth/login    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    200
    ${token}=    Set Variable    ${response.json()}[data][token]
    RETURN    ${token}

Get Auth Headers
    [Arguments]    ${token}
    [Documentation]    สร้าง authorization headers
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    RETURN    ${headers}

Cleanup Test User
    [Arguments]    ${email}=${TEST_EMAIL}    ${password}=${TEST_PASSWORD}
    [Documentation]    เข้าสู่ระบบและลบข้อมูลผู้ใช้ทดสอบ
    ${token}=    Login User    ${email}    ${password}
    Run Keyword And Ignore Error    Delete Test Data    ${token}

Delete Test Data
    [Arguments]    ${token}
    [Documentation]    ลบข้อมูลทดสอบที่สร้างขึ้นระหว่างการทดสอบ
    ${headers}=    Get Auth Headers    ${token}
    # เพิ่ม logic การลบข้อมูลที่นี่ถ้าจำเป็น
    Log    ทำความสะอาดข้อมูลเสร็จสิ้น

Short Cooldown
    [Documentation]    Short sleep to reduce request bursts between tests.
    Sleep    1.5s


GET With Retry
    [Documentation]    Perform GET on session with retry on 429 and 5xx responses (exponential backoff).
    [Arguments]    ${session}    ${endpoint}    ${headers}=None    ${params}=None    ${expected_status}=anything    ${max_retries}=5
    ${headers}=    Run Keyword If    ${headers}    Set Variable    ${headers}    ELSE    Create Dictionary
    ${params}=    Run Keyword If    ${params}    Set Variable    ${params}    ELSE    Create Dictionary

    FOR    ${i}    IN RANGE    ${max_retries}
        ${response}=    Get On Session    ${session}    ${endpoint}    headers=${headers}    params=${params}    expected_status=${expected_status}
        ${code}=    Set Variable    ${response.status_code}
        ${should_retry}=    Evaluate    str(${code}).startswith('5') or ${code} == 429
        Run Keyword If    not ${should_retry}    Return From Keyword    ${response}
        ${attempt}=    Evaluate    ${i} + 1
    ${sleep_sec}=    Evaluate    min(8, 1 * (2 ** ${i}))
        Log    Received ${code}, retrying GET (attempt ${attempt}) after ${sleep_sec}s
        Sleep    ${sleep_sec}s
    END
    Log    Returning last response after ${max_retries} attempts - status ${response.status_code}
    Log    Response body: ${response.text}
    Return From Keyword    ${response}

POST With Retry
    [Documentation]    Perform POST on session with retry on 429 and 5xx responses (exponential backoff).
    [Arguments]    ${session}    ${endpoint}    ${json}=None    ${headers}=None    ${expected_status}=anything    ${max_retries}=5
    ${json}=    Run Keyword If    ${json}    Set Variable    ${json}    ELSE    Create Dictionary
    ${headers}=    Run Keyword If    ${headers}    Set Variable    ${headers}    ELSE    Create Dictionary

    FOR    ${i}    IN RANGE    ${max_retries}
        ${response}=    Post On Session    ${session}    ${endpoint}    json=${json}    headers=${headers}    expected_status=${expected_status}
        ${code}=    Set Variable    ${response.status_code}
        ${should_retry}=    Evaluate    str(${code}).startswith('5') or ${code} == 429
        Run Keyword If    not ${should_retry}    Return From Keyword    ${response}
        ${attempt}=    Evaluate    ${i} + 1
    ${sleep_sec}=    Evaluate    min(8, 1 * (2 ** ${i}))
        Log    Received ${code}, retrying POST (attempt ${attempt}) after ${sleep_sec}s
        Sleep    ${sleep_sec}s
    END
    Log    Returning last POST response after ${max_retries} attempts - status ${response.status_code}
    Log    Response body: ${response.text}
    Return From Keyword    ${response}

PATCH With Retry
    [Documentation]    Perform PATCH on session with retry on 429 and 5xx responses (exponential backoff).
    [Arguments]    ${session}    ${endpoint}    ${json}=None    ${headers}=None    ${expected_status}=anything    ${max_retries}=5
    ${json}=    Run Keyword If    ${json}    Set Variable    ${json}    ELSE    Create Dictionary
    ${headers}=    Run Keyword If    ${headers}    Set Variable    ${headers}    ELSE    Create Dictionary

    FOR    ${i}    IN RANGE    ${max_retries}
        ${response}=    Patch On Session    ${session}    ${endpoint}    json=${json}    headers=${headers}    expected_status=${expected_status}
        ${code}=    Set Variable    ${response.status_code}
        ${should_retry}=    Evaluate    str(${code}).startswith('5') or ${code} == 429
        Run Keyword If    not ${should_retry}    Return From Keyword    ${response}
        ${attempt}=    Evaluate    ${i} + 1
    ${sleep_sec}=    Evaluate    min(8, 1 * (2 ** ${i}))
        Log    Received ${code}, retrying PATCH (attempt ${attempt}) after ${sleep_sec}s
        Sleep    ${sleep_sec}s
    END
    Log    Returning last PATCH response after ${max_retries} attempts - status ${response.status_code}
    Log    Response body: ${response.text}
    Return From Keyword    ${response}

PUT With Retry
    [Documentation]    Perform PUT on session with retry on 429 and 5xx responses (exponential backoff).
    [Arguments]    ${session}    ${endpoint}    ${json}=None    ${headers}=None    ${expected_status}=anything    ${max_retries}=5
    ${json}=    Run Keyword If    ${json}    Set Variable    ${json}    ELSE    Create Dictionary
    ${headers}=    Run Keyword If    ${headers}    Set Variable    ${headers}    ELSE    Create Dictionary

    FOR    ${i}    IN RANGE    ${max_retries}
        ${response}=    Put On Session    ${session}    ${endpoint}    json=${json}    headers=${headers}    expected_status=${expected_status}
        ${code}=    Set Variable    ${response.status_code}
        ${should_retry}=    Evaluate    str(${code}).startswith('5') or ${code} == 429
        Run Keyword If    not ${should_retry}    Return From Keyword    ${response}
        ${attempt}=    Evaluate    ${i} + 1
    ${sleep_sec}=    Evaluate    min(8, 1 * (2 ** ${i}))
        Log    Received ${code}, retrying PUT (attempt ${attempt}) after ${sleep_sec}s
        Sleep    ${sleep_sec}s
    END
    Log    Returning last PUT response after ${max_retries} attempts - status ${response.status_code}
    Log    Response body: ${response.text}
    Return From Keyword    ${response}

DELETE With Retry
    [Documentation]    Perform DELETE on session with retry on 429 and 5xx responses (exponential backoff).
    [Arguments]    ${session}    ${endpoint}    ${headers}=None    ${expected_status}=anything    ${max_retries}=5
    ${headers}=    Run Keyword If    ${headers}    Set Variable    ${headers}    ELSE    Create Dictionary

    FOR    ${i}    IN RANGE    ${max_retries}
        ${response}=    Delete On Session    ${session}    ${endpoint}    headers=${headers}    expected_status=${expected_status}
        ${code}=    Set Variable    ${response.status_code}
        ${should_retry}=    Evaluate    str(${code}).startswith('5') or ${code} == 429
        Run Keyword If    not ${should_retry}    Return From Keyword    ${response}
        ${attempt}=    Evaluate    ${i} + 1
        ${sleep_sec}=    Evaluate    min(8, 1 * (2 ** ${i}))
        Log    Received ${code}, retrying DELETE (attempt ${attempt}) after ${sleep_sec}s
        Sleep    ${sleep_sec}s
    END
    Log    Returning last DELETE response after ${max_retries} attempts - status ${response.status_code}
    Log    Response body: ${response.text}
    Return From Keyword    ${response}


Reset Rate Limits For Session
    [Documentation]    Call the dev-only endpoint to reset rate-limit counters for the test session.
    # Best-effort: ignore errors if endpoint doesn't exist or server not running in dev-mode
    ${resp}=    Post On Session    api    /test/reset-rate-limit    expected_status=200
    Log    Reset rate limits response: ${resp.status_code}


Setup And Register Test User
    [Documentation]    Combined Suite Setup: create session and register the test user.
    Setup Test Session
    Register Test User
    Short Cooldown
    # Ensure the registered user has at least one order to allow list endpoints to return data
    Run Keyword And Ignore Error    Ensure Test Order Exists


Ensure Test Order Exists
    [Documentation]    Ensure the current test user has at least one order. This will try to find an available sheet and create an order.
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${sheets_resp}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${None}    200
    ${sheets_json}=    Set Variable    ${sheets_resp.json()}
    ${first_sheet}=    Set Variable If    ${sheets_json}[data]    ${sheets_json}[data][0][id]    ${None}
    Run Keyword If    '${first_sheet}' == 'None'    Log    No sheets found to create order; skipping order creation    WARN
    Run Keyword If    '${first_sheet}' != 'None'    Create Test Order    ${first_sheet}    ${headers}


Create Test Order
    [Arguments]    ${sheet_id}    ${headers}
    [Documentation]    Create an order for the logged-in user using the given sheet id.
    ${item}=    Create Dictionary    sheetId=${sheet_id}    quantity=1
    ${items}=    Create List    ${item}
    ${data}=    Create Dictionary    items=${items}
    ${order_resp}=    POST With Retry    api    ${ORDERS_CREATE}    ${data}    ${headers}    201
    Log    Created test order: ${order_resp.status_code}

