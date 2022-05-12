/**
 * Sample React Native App using MongoDb and Auth0 to showcase the initiateClientReset bug happening on the Changeway MongoDb application.
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component } from "react";
import { SafeAreaView, StyleSheet, ScrollView, View, Text, StatusBar } from "react-native";

import { Colors } from "react-native/Libraries/NewAppScreen";
import Realm from "realm";
import Auth0 from "react-native-auth0";
import { generateSecureRandom } from "react-native-securerandom";
import SInfo from "react-native-sensitive-info";
import { userSchema } from "./userSchema";
import TouchableScale from "react-native-touchable-scale";
import { Buffer } from "buffer";
import { ObjectId } from "bson";

const MONGO_URL = "clientresettest-sdkem"; // <- update this
const clientId = "VwJ0Vn8vH8Mz5g2rnAsosPP3YxyNSydt";
const auth0 = new Auth0({ domain: "dev-3kkwsyca.eu.auth0.com", clientId: clientId, aud: "clientresettest-sdkem" });

const appConfig = {
	id: MONGO_URL,
	timeout: 10000,
	app: {
		name: "default",
		version: "0"
	}
};
const app = new Realm.App(appConfig);
let realm;
let realmOpened = false;

const errorSync = (_session, error) => {
	console.warn("err", error);
	if (realm && app) {
		if (error.name === "ClientReset" || error.message.includes("Bad changeset")) {
			const realmPath = realm.path;
			realm.close();

			if (realmPath !== undefined) {
				try {
					Realm.App.Sync.initiateClientReset(app, realmPath); // pass your realm app instance, and realm path to initiateClientReset()
				} catch (err) {
					console.log("err", err);
				}
			}

			// console.log(`Error ${error.message}, need to reset ${realmPath}…`, realm);
			// console.log(`Creating backup from $…`);
			// Move backup file to a known location for a restore
			// RNFetchBlob.fs.renameSync(error.config.path, realmPath + "~");
			// Discard the reference to the realm instance
			// realm = null;
		} else {
			console.log(`Received error ${error.message}`);
		}
	}
};

const RealmOpen = async (config) => {
	return new Promise(async (resolve, reject) => {
		try {
			const newConfig = {
				sync: {
					user: config.sync.user,
					partitionValue: config.sync.partitionValue,
					error: (_session, error) => {
						errorSync(_session, error);
					},
					clientReset: {
						mode: "manual"
					}
				},
				encryptionKey: config.encryptionKey,
				schema: config.schema
			};
			realm = await Realm.open(newConfig);
			if (realm !== undefined) {
				resolve(realm);
			} else {
				reject();
			}
		} catch (err) {
			console.log("ERRR", err);
			reject(err);
		}
	});
};

const displayLogin = (type) => {
	auth0.webAuth
		.authorize({
			scope: "openid profile email",
			audience: "https://dev-3kkwsyca.eu.auth0.com/userinfo",
			prompt: "login",
			screen_hint: type
		})
		.then((credentials) => {
			SInfo.setItem("changewayAccessToken", credentials.accessToken, {}).then((value) => {});
			SInfo.setItem("changewayIdToken", credentials.idToken, {}).then((value) => {});
			handleSubmit(credentials);
		})
		.catch((error) => {
			console.log(error);
		});
};

const handleSubmit = (credentials) => {
	let creds = Realm.Credentials.jwt(credentials.idToken);
	const user = app
		.logIn(creds)
		.then((user) => {
			getOrSetKey(user, credentials.accessToken);
		})
		.catch((error) => {
			console.warn("ERROR IN HERE", error);
		});
};

const getOrSetKey = (user, accessToken) => {
	SInfo.getItem("realmKey", {}).then((key) => {
		if (!key) {
			generateSecureRandom(64).then((randomBytes) => {
				const buffer = randomBytes.buffer;
				key = Array.prototype.map
					.call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
					.join("");
				SInfo.setItem("realmKey", key, {}).then((value) => {});
				onAuthenticated(user, accessToken, randomBytes);
			});
		} else {
			let encKey = Uint8Array.from(Buffer.from(key, "hex"));
			onAuthenticated(user, accessToken, encKey);
		}
	});
};

const onAuthenticated = (user, accessToken, key) => {
	const userConfig = {
		sync: {
			user: user,
			partitionValue: `userRealm=${user.customData?.userId}`
		},
		encryptionKey: key,
		schema: userSchema
	};
	RealmOpen(userConfig)
		.then((userRealm) => {
			console.log("Realm Opened Succesfully");
			let profiles = userRealm.objects("Profile");
			console.warn(profiles);
			realmOpened = true;
		})
		.catch((error) => {
			console.log("err", error);
		});
};

const triggerError = () => {
	realm.write(() => {
		let newFile = realm.create("File", {
			_id: new ObjectId(),
			_partition: "asfgasfasgn",
			url: "newFile.url",
			type: "newFile.type",
			text: "newFile.tex",
			displayThumbnail: false
		});
		console.log(newFile);
	});
};

class App extends Component {
	render() {
		return (
			<>
				<StatusBar barStyle="dark-content" />
				<SafeAreaView>
					<ScrollView
						contentInsetAdjustmentBehavior="automatic"
						style={styles.scrollView}
						contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
					>
						<Text style={{ textAlign: "center" }}>
							Step 1: Click the LogIn button and use the details provided to authenticate via auth0
						</Text>
						{!realmOpened && (
							<TouchableScale
								style={{
									borderWidth: StyleSheet.hairlineWidth,
									borderColor: "blue",
									alignItems: "center",
									borderRadius: 5,
									paddingVertical: 20,
									width: 200,
									backgroundColor: "blue"
								}}
								onPress={() => {
									displayLogin("");
								}}
							>
								<Text
									style={{
										textAlign: "center",
										color: "white",
										fontSize: 10
									}}
								>
									Log In
								</Text>
							</TouchableScale>
						)}
						<Text style={{ textAlign: "center" }}>
							Step 2: After the login wait for the Realm opened log, then click the button below to
							trigger a badChangeset error and trigger the initiateClientReset{" "}
						</Text>
						<TouchableScale
							style={{
								borderWidth: StyleSheet.hairlineWidth,
								borderColor: "blue",
								alignItems: "center",
								borderRadius: 5,
								paddingVertical: 20,
								width: 200,
								backgroundColor: "blue"
							}}
							onPress={() => {
								triggerError();
							}}
						>
							<Text
								style={{
									textAlign: "center",
									color: "white",
									fontSize: 10
								}}
							>
								Test Error
							</Text>
						</TouchableScale>
					</ScrollView>
				</SafeAreaView>
			</>
		);
	}
}

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: Colors.lighter
	},
	engine: {
		position: "absolute",
		right: 0
	},
	body: {
		backgroundColor: Colors.white
	},
	sectionContainer: {
		marginTop: 32,
		paddingHorizontal: 24
	},
	sectionTitle: {
		fontSize: 24,
		fontWeight: "600",
		color: Colors.black
	},
	sectionDescription: {
		marginTop: 8,
		fontSize: 18,
		fontWeight: "400",
		color: Colors.dark
	},
	highlight: {
		fontWeight: "700"
	},
	footer: {
		color: Colors.dark,
		fontSize: 12,
		fontWeight: "600",
		padding: 4,
		paddingRight: 12,
		textAlign: "right"
	}
});

export default App;
