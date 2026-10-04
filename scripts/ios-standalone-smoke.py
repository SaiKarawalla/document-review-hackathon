"""Generate an ignored XCTest runner for the standalone simulator app. No keys/servers."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
folder=root/'artifacts'/'ios-standalone-smoke'
project=folder/'MobileSmoke.xcodeproj'
scheme=project/'xcshareddata'/'xcschemes'
scheme.mkdir(parents=True,exist_ok=True)
swift=r'''import XCTest
final class MobileSmoke: XCTestCase {
    let app=XCUIApplication(bundleIdentifier:"com.documentreview.hackathon")
    func reach(_ label:String)->XCUIElement {
        let button=app.buttons[label].firstMatch
        for _ in 0..<20 {
            if button.exists && button.isHittable {return button}
            if button.exists && button.frame.midY < app.frame.midY {app.swipeDown()} else {app.swipeUp()}
        }
        return button
    }
    func shot(_ name:String){let item=XCTAttachment(screenshot:app.screenshot());item.name=name;item.lifetime = .keepAlways;add(item)}
    func testStandaloneRealQwen() throws {
        continueAfterFailure=false
        app.terminate();app.launch()
        XCTAssertTrue(app.staticTexts["Document Review"].waitForExistence(timeout:20),"Release app launches from bundled JS, without Metro")
        XCTAssertFalse(app.buttons["Pair Mac for local AI"].exists)
        reach("Address conflict").tap();reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
        XCTAssertTrue(app.buttons["5 consistent checks • show"].exists)
        reach("Source Mailing address statement").tap()
        XCTAssertTrue(app.staticTexts["Original PDF • page 1"].waitForExistence(timeout:10))
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout:10));shot("standalone-original-pdf")
        reach("Close source").tap()
        reach("Load Qwen on this iPhone").tap()
        XCTAssertTrue(app.staticTexts["Qwen2.5-0.5B-Instruct • ready on this iPhone"].waitForExistence(timeout:60),"Bundled real GGUF must load in native runtime")
        reach("Preview exact AI request").tap()
        XCTAssertTrue(app.buttons["View full exact request"].waitForExistence(timeout:15))
        reach("View full exact request").tap()
        let body=app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@","{\"model\"")).firstMatch
        XCTAssertTrue(body.waitForExistence(timeout:5))
        for value in ["Avery Example","Fiction Lane","Imaginary Avenue","DEMO-ACCT","4200.00","2026-09-30"] {XCTAssertFalse(body.label.contains(value))}
        XCTAssertTrue(body.label.contains("Qwen2.5-0.5B-Instruct"));XCTAssertTrue(body.label.contains("<|im_start|>"))
        shot("standalone-exact-request");reach("Close request").tap()
        let approve=app.otherElements["Approve minimized request to on-device Qwen"].firstMatch
        XCTAssertTrue(approve.exists);approve.tap();reach("Explain on this iPhone").tap()
        XCTAssertTrue(app.staticTexts["AI explanation • Qwen on this iPhone"].waitForExistence(timeout:130),"Real local native model, no Mac Ollama or HTTP")
        XCTAssertTrue(app.staticTexts["The documents contain different information; human review is needed."].exists || app.staticTexts["This difference needs clarification and does not show which document is correct."].exists)
        shot("standalone-real-qwen")
        app.buttons["Reset"].tap()
        XCTAssertFalse(app.staticTexts["AI explanation • Qwen on this iPhone"].exists)
        reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
        reach("Review Mailing address statement").tap()
        let field=app.textViews["Confirmed value"]
        XCTAssertTrue(field.waitForExistence(timeout:5));field.tap();field.press(forDuration:1.2)
        XCTAssertTrue(app.menuItems["Select All"].waitForExistence(timeout:3));app.menuItems["Select All"].tap()
        field.typeText("14 Fiction Lane, Sampleton, ZZ 00000");reach("Confirm value").tap()
        XCTAssertTrue(app.buttons["6 consistent checks • show"].waitForExistence(timeout:5))
        XCUIDevice.shared.press(.home);XCTAssertTrue(app.wait(for:.runningBackground,timeout:5));Thread.sleep(forTimeInterval:1)
        app.activate();XCTAssertFalse(app.staticTexts["Avery Example"].exists)
        XCTAssertTrue(app.buttons["Load Qwen on this iPhone"].exists,"Background releases native model and clears case")
    }
}
'''
(folder/'MobileSmoke.swift').write_text(swift)
# Reuse the existing no-host simulator test project definitions, without executing its pairing setup.
base=(root/'scripts'/'ios-smoke-project.py').read_text()
for expression,target in [("(project/'project.pbxproj').write_text('''",project/'project.pbxproj'),("(scheme/'MobileSmoke.xcscheme').write_text('''",scheme/'MobileSmoke.xcscheme')]:
    start=base.index(expression)+len(expression)
    end=base.index("''')",start)
    target.write_text(base[start:end])
print('Created standalone simulator UI runner; no pairing, credentials or server setup.')
