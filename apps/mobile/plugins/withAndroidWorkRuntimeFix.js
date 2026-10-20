const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Android release builds failed with "Duplicate class androidx.work.OneTimeWorkRequestKt": react-native-android-widget brings
 * androidx.work:work-runtime 2.8.1, while another library still asks for the separate work-runtime-ktx 2.7.1. Since 2.8 the Kotlin
 * extensions live inside work-runtime itself, so the old ktx artifact is redundant; leaving it out removes the duplicate classes.
 * The android/ folder is generated (never committed), so the fix is applied here, at prebuild.
 */
const MARKER = "// work-runtime-ktx is part of work-runtime since 2.8";
const FIX = `
${MARKER}
configurations.all {
    exclude group: 'androidx.work', module: 'work-runtime-ktx'
}
`;

module.exports = function withAndroidWorkRuntimeFix(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MARKER)) mod.modResults.contents += FIX;
    return mod;
  });
};
