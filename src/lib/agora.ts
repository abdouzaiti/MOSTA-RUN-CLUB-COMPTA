import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

const appId = (import.meta as any).env.VITE_AGORA_APP_ID;

export const isAgoraConfigured = !!(appId && appId.trim() !== '');

export interface AgoraCallConfig {
  channelName: string;
  token?: string | null;
  uid?: string | number | null;
  type: 'voice' | 'video';
  onUserPublished: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  onUserUnpublished: (user: IAgoraRTCRemoteUser) => void;
}

export class AgoraManager {
  client: IAgoraRTCClient | null = null;
  localAudioTrack: IMicrophoneAudioTrack | null = null;
  localVideoTrack: ICameraVideoTrack | null = null;

  async joinCall(config: AgoraCallConfig) {
    if (!isAgoraConfigured) {
      console.warn("Agora App ID is not configured in .env. Falling back to simulation mode.");
      return null;
    }

    try {
      // Create Agora client
      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Handle remote user publication events
      this.client.on("user-published", async (user, mediaType) => {
        if (this.client && (mediaType === 'audio' || mediaType === 'video')) {
          await this.client.subscribe(user, mediaType);
          config.onUserPublished(user, mediaType);
        }
      });

      this.client.on("user-unpublished", (user) => {
        config.onUserUnpublished(user);
      });

      // Join the channel
      const uid = await this.client.join(
        appId!,
        config.channelName,
        config.token || null,
        config.uid || null
      );

      // Create local tracks and publish
      try {
        if (config.type === 'video') {
          this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
        } else {
          this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          await this.client.publish([this.localAudioTrack]);
        }
      } catch (trackError) {
        console.error("Failed to acquire microphone or camera hardware:", trackError);
      }

      return {
        uid,
        client: this.client,
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack
      };
    } catch (err) {
      console.error("Agora joinCall failed:", err);
      throw err;
    }
  }

  async leaveCall() {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
    } catch (e) {
      console.error("Error stopping audio track:", e);
    }

    try {
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
    } catch (e) {
      console.error("Error stopping video track:", e);
    }

    try {
      if (this.client) {
        await this.client.leave();
        this.client = null;
      }
    } catch (e) {
      console.error("Error leaving client:", e);
    }
  }

  async setMuteMicrophone(mute: boolean) {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(!mute);
    }
  }

  async setCameraEnabled(enabled: boolean) {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(enabled);
    }
  }
}
