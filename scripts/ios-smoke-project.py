"""Generate an ignored XCTest UI runner for the installed Expo Go simulator.
Pairing remains private in ignored artifacts; never print/source-control it.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
folder=root/'artifacts'/'ios-smoke'
project=folder/'MobileSmoke.xcodeproj'
scheme=project/'xcshareddata'/'xcschemes'
scheme.mkdir(parents=True,exist_ok=True)
pairing=(root/'artifacts'/'mobile-pairing.json').read_text()
swift=r'''import XCTest
import UIKit
final class MobileSmoke: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "host.exp.Exponent")
    func reach(_ label: String) -> XCUIElement {
        let button = app.buttons[label].firstMatch
        for _ in 0..<20 {
            if button.exists && button.isHittable {return button}
            if button.exists && button.frame.midY < app.frame.midY {app.swipeDown()} else {app.swipeUp()}
        }
        return button
    }
    func closeExpoTools() {
        if app.staticTexts["Tools button"].exists {
            // Installed Expo Go menu: turn off its floating button, then close.
            app.coordinate(withNormalizedOffset:CGVector(dx:0.85,dy:0.544)).tap()
            app.coordinate(withNormalizedOffset:CGVector(dx:0.915,dy:0.111)).tap()
        }
    }
    func shot(_ name: String) { let image = XCTAttachment(screenshot: app.screenshot()); image.name=name; image.lifetime = .keepAlways; add(image) }
    func freshSession() {
        XCUIDevice.shared.press(.home)
        XCTAssertTrue(app.wait(for:.runningBackground,timeout:5))
        Thread.sleep(forTimeInterval:1) // Allow React Native's background callback.
        app.activate();closeExpoTools()
        XCTAssertFalse(app.buttons["Pair a different Mac"].exists,"Background must clear pairing")
    }
    func testRedesignNavigationThemesCountriesAndPDF() throws {
        continueAfterFailure = false
        freshSession()
        XCTAssertTrue(app.buttons["Home tab"].waitForExistence(timeout:25))
        app.buttons["Settings tab"].tap()
        reach("locale-en").tap();reach("theme-light").tap()
        app.buttons["Home tab"].tap()
        XCTAssertTrue(app.buttons["Compare documents"].waitForExistence(timeout:5))
        shot("redesign-home-light")
        reach("country-picker").tap()
        XCTAssertTrue(app.buttons["country-US"].waitForExistence(timeout:5))
        for id in ["US","GB","ES","MX","MU","IN","CN","SG","FR","CA"] {
            reach("country-"+id).tap()
            XCTAssertTrue(app.buttons["country-"+id].isSelected,"Country selection must update")
        }
        shot("redesign-country-canada")
        reach("country-US").tap();reach("Done").tap()
        XCTAssertTrue(app.buttons["Home tab"].waitForExistence(timeout:5))
        app.buttons["Settings tab"].tap()
        for (id,title) in [("es","Tus preferencias"),("hi","आपकी पसंद"),("zh-Hans","你的偏好"),("fr","Vos préférences"),("en","Your preferences")] {
            reach("locale-"+id).tap()
            XCTAssertTrue(app.staticTexts[title].exists,"Display language must update new navigation")
        }
        reach("theme-dark").tap();shot("redesign-settings-dark")
        app.buttons["Home tab"].tap();shot("redesign-home-dark")
        reach("Compare documents").tap()
        XCTAssertTrue(app.buttons["Try a demo"].waitForExistence(timeout:5))
        reach("Try a demo").tap();reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["What needs attention"].waitForExistence(timeout:25))
        XCTAssertTrue(app.buttons["5 consistent checks • show"].exists,"Actual address conflict persists after redesign")
        shot("redesign-review-dark")
        reach("Review extracted fields").tap()
        reach("Source Mailing address statement").tap()
        XCTAssertTrue(app.staticTexts["Original PDF • page 1"].waitForExistence(timeout:10));shot("redesign-source-dark")
        reach("Close source").tap()
        reach("Review Mailing address statement").tap()
        XCTAssertTrue(app.textViews["Confirmed value"].waitForExistence(timeout:5));reach("Cancel").tap()
        reach("Proof Mode").tap();reach("Prove Financial Resources").tap()
        XCTAssertTrue(app.buttons["Confirm selected evidence"].exists)
        reach("Confirm selected evidence").tap();shot("redesign-proof-dark")
        reach("Continue to AI").tap()
        XCTAssertTrue(app.staticTexts["Explain with AI"].waitForExistence(timeout:5))
        XCTAssertFalse(app.buttons["Send approved request"].exists,"No bypass around exact preview")
        reach("Show rule-based summary (no AI)").tap()
        XCTAssertTrue(app.staticTexts["Rule-based summary • no AI response"].waitForExistence(timeout:5));shot("redesign-ai-dark")
        app.buttons["Reset"].tap()
        XCTAssertTrue(app.buttons["Choose PDFs from Files"].waitForExistence(timeout:5))
        app.buttons["Settings tab"].tap();reach("theme-light").tap()
        app.buttons["Home tab"].tap();shot("redesign-home-final")
    }
    func testActualMobileFlow() throws {
        continueAfterFailure = false
        freshSession()
        XCTAssertTrue(app.staticTexts["Document Review"].waitForExistence(timeout:20))
        app.buttons["Reset"].tap()
        closeExpoTools()
        reach("Address conflict").tap()
        reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25), "Real PDFs must parse on the iPhone")
        XCTAssertTrue(app.buttons["5 consistent checks • show"].exists,"Start with a real address conflict")
        shot("phone-parsed-documents")
        reach("Source Mailing address statement").tap()
        XCTAssertTrue(app.staticTexts["Original PDF • page 1"].waitForExistence(timeout:10))
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout:10))
        shot("phone-source-pdf")
        reach("Close source").tap()
        reach("Review Mailing address statement").tap()
        let confirmed=app.textViews["Confirmed value"]
        XCTAssertTrue(confirmed.waitForExistence(timeout:5))
        confirmed.tap(); confirmed.press(forDuration:1.2)
        XCTAssertTrue(app.menuItems["Select All"].waitForExistence(timeout:3));app.menuItems["Select All"].tap()
        confirmed.typeText("14 Fiction Lane, Sampleton, ZZ 00000")
        XCTAssertEqual(confirmed.value as? String,"14 Fiction Lane, Sampleton, ZZ 00000")
        reach("Confirm value").tap()
        XCTAssertTrue(app.buttons["6 consistent checks • show"].waitForExistence(timeout:5),"Correction must recompute the real comparison")
        // Reset to the unchanged, real conflict fixtures before model demo.
        app.buttons["Reset"].tap(); reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
        reach("Show rule-based summary (no AI)").tap()
        XCTAssertTrue(app.staticTexts["Rule-based summary • no AI response"].waitForExistence(timeout:5))
        shot("phone-rule-backup")
        reach("Pair Mac for local AI").tap()
        let code=app.textViews["Private pairing code"]
        XCTAssertTrue(code.waitForExistence(timeout:5))
        UIPasteboard.general.string=PAIRING_LITERAL
        code.tap(); code.press(forDuration:1.2)
        XCTAssertTrue(app.menuItems["Paste"].waitForExistence(timeout:5));app.menuItems["Paste"].tap()
        if app.alerts.buttons["Allow Paste"].exists {app.alerts.buttons["Allow Paste"].tap()}
        reach("Connect Mac").tap()
        XCTAssertTrue(app.staticTexts["qwen2.5:1.5b • ready on Mac"].waitForExistence(timeout:15))
        reach("Preview exact AI request").tap()
        XCTAssertTrue(app.buttons["View full exact request"].waitForExistence(timeout:15))
        reach("View full exact request").tap()
        let body=app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "{\"model\"" )).firstMatch
        XCTAssertTrue(body.waitForExistence(timeout:5))
        for excluded in ["Avery Example", "Fiction Lane", "Imaginary Avenue", "DEMO-ACCT", "4200.00", "2026-09-30"] {XCTAssertFalse(body.label.contains(excluded))}
        shot("phone-exact-preview")
        reach("Close request").tap()
        let approve=app.otherElements["Approve minimized request to paired Mac"].firstMatch
        XCTAssertTrue(approve.exists);approve.tap()
        reach("Send approved request").tap()
        XCTAssertTrue(app.staticTexts["AI explanation • Ollama on Mac"].waitForExistence(timeout:70))
        shot("phone-real-ollama")
        app.buttons["Reset"].tap()
        XCTAssertFalse(app.staticTexts["AI explanation • Ollama on Mac"].exists)
    }
    func testPhase6VisaProofAndFiveLanguages() throws {
        continueAfterFailure=false
        freshSession()
        reach("locale-en").tap()
        app.buttons["Reset"].tap()
        reach("Visa name conflict").tap();reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Jordan Example"].firstMatch.waitForExistence(timeout:25))
        XCTAssertTrue(app.buttons["3 consistent checks • show"].exists)
        reach("Source Name visa").tap()
        XCTAssertTrue(app.staticTexts["Original PDF • page 1"].waitForExistence(timeout:10))
        shot("phase6-visa-source")
        reach("Close source").tap()
        for code in ["es","hi","zh-Hans","fr","en"] {
            reach("locale-" + code).tap();shot("phase6-language-" + code)
        }
        app.buttons["Reset"].tap();reach("Visa only").tap();reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
        XCTAssertTrue(app.buttons["1 consistent checks • show"].exists)
        shot("phase6-single-visa-missing")
        app.buttons["Reset"].tap();reach("Visa + statement").tap();reach("Load demo pair").tap()
        XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
        reach("Prove Financial Resources").tap()
        XCTAssertTrue(app.staticTexts["15 source fields • 7 selected locally • 8 excluded • 5 derived findings prepared • 0 literal values in AI context"].exists)
        reach("Inspect included and excluded fields").tap();shot("phase6-proof-evidence")
        reach("Confirm selected evidence").tap()
        XCTAssertTrue(app.buttons["5 consistent checks • show"].exists)
        reach("Pair Mac for local AI").tap()
        let code=app.textViews["Private pairing code"]
        UIPasteboard.general.string=PAIRING_LITERAL
        code.tap();code.press(forDuration:1.2);app.menuItems["Paste"].tap()
        if app.alerts.buttons["Allow Paste"].exists {app.alerts.buttons["Allow Paste"].tap()}
        reach("Connect Mac").tap()
        XCTAssertTrue(app.staticTexts["qwen2.5:1.5b • ready on Mac"].waitForExistence(timeout:15))
        reach("Preview exact AI request").tap();reach("View full exact request").tap()
        let body=app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "{\"model\"" )).firstMatch
        XCTAssertTrue(body.waitForExistence(timeout:5))
        XCTAssertTrue(body.label.contains("financial-resources"))
        for excluded in ["Avery Example","DEMO-PASSPORT","DEMO-ACCT","4200.00","2026-09-30"] {XCTAssertFalse(body.label.contains(excluded))}
        shot("phase6-proof-exact-request");reach("Close request").tap()
        app.otherElements["Approve minimized request to paired Mac"].firstMatch.tap();reach("Send approved request").tap()
        XCTAssertTrue(app.staticTexts["AI explanation • Ollama on Mac"].waitForExistence(timeout:70));shot("phase6-real-phone-ollama")
        reach("locale-es").tap();reach("locale-en").tap()
        // Display-only language changes retain the real response and do not call the model again.
        reach("5 consistent checks • show").tap()
        XCTAssertTrue(app.staticTexts["AI explanation • Ollama on Mac"].exists)
        app.buttons["Reset"].tap()
    }
    func testPhotoLensRedactionLocalOCRAndRealAI() throws {
        continueAfterFailure=false
        freshSession();app.buttons["Settings tab"].tap();reach("locale-en").tap();reach("theme-light").tap()
        reach("Pair Mac for local AI").tap()
        let code=app.textViews["Private pairing code"]
        UIPasteboard.general.string=PAIRING_LITERAL
        code.tap();code.press(forDuration:1.2);app.menuItems["Paste"].tap()
        if app.alerts.buttons["Allow Paste"].exists {app.alerts.buttons["Allow Paste"].tap()}
        reach("Connect Mac").tap()
        XCTAssertTrue(app.staticTexts["qwen2.5:1.5b • ready on Mac"].waitForExistence(timeout:15))
        app.buttons["Home tab"].tap();reach("Read a document photo").tap()
        XCTAssertTrue(app.staticTexts["Read what you choose."].waitForExistence(timeout:20))
        reach("Try synthetic statement photo").tap()
        let analyze=app.webViews.buttons["Analyze visible photo"].firstMatch
        XCTAssertTrue(analyze.waitForExistence(timeout:20))
        // Scroll so the entire WebView toolbar is visible, then cover the sample account.
        let photo=app.webViews.images["Document photo"].firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout:10))
        for _ in 0..<6 {if photo.frame.minY+photo.frame.width*0.48 < app.frame.maxY-100 {break};app.swipeUp()}
        let frame=photo.frame
        print("Photo canvas bounds: \(frame)")
        let x0=frame.minX+frame.width*0.27, x1=frame.minX+frame.width*0.75
        let y=frame.minY+frame.width*0.480
        let origin=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0))
        origin.withOffset(CGVector(dx:x0,dy:y)).press(forDuration:0.08,thenDragTo:origin.withOffset(CGVector(dx:x1,dy:y)))
        XCTAssertTrue(app.webViews.buttons["Undo cover"].firstMatch.isEnabled,"A real cover stroke must be registered")
        shot("photo-native-covered-before-ocr")
        reach("Analyze visible photo").tap()
        XCTAssertTrue(app.staticTexts["What was read"].waitForExistence(timeout:50),"Actual WKWebView OCR must finish")
        XCTAssertFalse(app.staticTexts["DEMO-ACCT-1001"].exists,"Covered identifier must not appear")
        reach("Show term list").tap();reach("Closing balance").tap()
        XCTAssertTrue(app.staticTexts["The balance shown at the end of this statement period. It is not monthly income or a promise of money available today."].waitForExistence(timeout:5))
        shot("photo-native-term-definition");reach("Close definition").tap()
        reach("I checked the visible text").tap();reach("Continue to photo AI").tap()
        reach("Preview photo AI request").tap()
        XCTAssertTrue(app.buttons["View exact photo request"].waitForExistence(timeout:15))
        reach("View exact photo request").tap()
        let body=app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "{\"model\"" )).firstMatch
        XCTAssertTrue(body.waitForExistence(timeout:5))
        XCTAssertTrue(body.label.contains("redacted-photo"))
        for value in ["Avery Example","Fiction Lane","DEMO-ACCT","4200.00","2026-09-30","base64"] {XCTAssertFalse(body.label.contains(value))}
        shot("photo-native-exact-preview");reach("Close photo request").tap()
        let approval=app.otherElements["Approve photo minimized request"].firstMatch
        let send=app.buttons["Explain approved photo review"].firstMatch
        approval.tap()
        let enabled=NSPredicate(format:"enabled == true")
        if XCTWaiter.wait(for:[XCTNSPredicateExpectation(predicate:enabled,object:send)],timeout:2) != .completed {approval.tap()}
        XCTAssertEqual(XCTWaiter.wait(for:[XCTNSPredicateExpectation(predicate:enabled,object:send)],timeout:5),.completed,"Explicit approval must enable Send")
        reach("Explain approved photo review").tap()
        XCTAssertTrue(app.staticTexts["AI explanation · real Qwen"].waitForExistence(timeout:70));shot("photo-native-real-qwen")
        reach("New photo").tap()
        XCTAssertFalse(app.staticTexts["AI explanation · real Qwen"].exists)
        XCTAssertFalse(app.staticTexts["Avery Example"].exists)
        reach("Back").tap()
        XCTAssertTrue(app.staticTexts["Review documents"].exists)
    }
    func testOtherRealPdfCasesAndBackgroundClear() throws {
        continueAfterFailure=false
        freshSession()
        for (scenario,expected) in [("Matching","6 consistent checks • show"),("Missing fields","4 consistent checks • show"),("Embedded instruction","6 consistent checks • show")] {
            app.buttons["Reset"].tap();reach(scenario).tap();reach("Load demo pair").tap()
            XCTAssertTrue(app.staticTexts["Avery Example"].firstMatch.waitForExistence(timeout:25))
            XCTAssertTrue(app.buttons[expected].waitForExistence(timeout:5),scenario)
            reach("Show rule-based summary (no AI)").tap()
            XCTAssertTrue(app.staticTexts["Rule-based summary • no AI response"].waitForExistence(timeout:5))
        }
        shot("phone-embedded-instruction-excluded")
        freshSession()
        XCTAssertFalse(app.staticTexts["Avery Example"].exists)
        XCTAssertFalse(app.staticTexts["Rule-based summary • no AI response"].exists)
        XCTAssertTrue(app.buttons["Pair Mac for local AI"].exists)
    }
}
'''.replace('PAIRING_LITERAL',json.dumps(pairing))
(folder/'MobileSmoke.swift').write_text(swift)
(project/'project.pbxproj').write_text('''// !$*UTF8*$!
{ archiveVersion = 1; classes = {}; objectVersion = 56; objects = {
A10000000000000000000001 = {isa=PBXProject; buildConfigurationList=A10000000000000000000002; compatibilityVersion="Xcode 14.0"; mainGroup=A10000000000000000000003; productRefGroup=A10000000000000000000004; projectDirPath=""; projectRoot=""; targets=(A10000000000000000000005);};
A10000000000000000000002 = {isa=XCConfigurationList; buildConfigurations=(A10000000000000000000006); defaultConfigurationIsVisible=0; defaultConfigurationName=Debug;};
A10000000000000000000003 = {isa=PBXGroup; children=(A10000000000000000000007,A10000000000000000000004); sourceTree="<group>";};
A10000000000000000000004 = {isa=PBXGroup; children=(A10000000000000000000008); name=Products; sourceTree="<group>";};
A10000000000000000000005 = {isa=PBXNativeTarget; buildConfigurationList=A10000000000000000000009; buildPhases=(A10000000000000000000010); buildRules=(); dependencies=(); name=MobileSmoke; productName=MobileSmoke; productReference=A10000000000000000000008; productType="com.apple.product-type.bundle.ui-testing";};
A10000000000000000000006 = {isa=XCBuildConfiguration; buildSettings={SDKROOT=iphonesimulator; IPHONEOS_DEPLOYMENT_TARGET=17.0; SWIFT_VERSION=5.0;}; name=Debug;};
A10000000000000000000007 = {isa=PBXFileReference; lastKnownFileType=sourcecode.swift; path=MobileSmoke.swift; sourceTree="<group>";};
A10000000000000000000008 = {isa=PBXFileReference; explicitFileType=wrapper.cfbundle; includeInIndex=0; path=MobileSmoke.xctest; sourceTree=BUILT_PRODUCTS_DIR;};
A10000000000000000000009 = {isa=XCConfigurationList; buildConfigurations=(A10000000000000000000011); defaultConfigurationIsVisible=0; defaultConfigurationName=Debug;};
A10000000000000000000010 = {isa=PBXSourcesBuildPhase; buildActionMask=2147483647; files=(A10000000000000000000012); runOnlyForDeploymentPostprocessing=0;};
A10000000000000000000011 = {isa=XCBuildConfiguration; buildSettings={PRODUCT_BUNDLE_IDENTIFIER=com.documentreview.smoketests; PRODUCT_NAME="$(TARGET_NAME)"; GENERATE_INFOPLIST_FILE=YES; CODE_SIGNING_ALLOWED=NO; TARGETED_DEVICE_FAMILY="1,2"; ENABLE_USER_SCRIPT_SANDBOXING=YES;}; name=Debug;};
A10000000000000000000012 = {isa=PBXBuildFile; fileRef=A10000000000000000000007;};
}; rootObject=A10000000000000000000001; }
''')
(scheme/'MobileSmoke.xcscheme').write_text('''<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="2600" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="NO" buildForProfiling="NO" buildForArchiving="NO" buildForAnalyzing="YES"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="A10000000000000000000005" BuildableName="MobileSmoke.xctest" BlueprintName="MobileSmoke" ReferencedContainer="container:MobileSmoke.xcodeproj"/></BuildActionEntry></BuildActionEntries></BuildAction><TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables><TestableReference skipped="NO"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="A10000000000000000000005" BuildableName="MobileSmoke.xctest" BlueprintName="MobileSmoke" ReferencedContainer="container:MobileSmoke.xcodeproj"/></TestableReference></Testables></TestAction></Scheme>''')
print('Created private, ignored simulator UI test runner. Pairing contents were not printed.')
