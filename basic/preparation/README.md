# OMRON-Handson-Preparation

この文書はOMRON環境センサ(USB型)　形2JCIE-BU01のハンズオン実施者が予め行う準備項目です。

## 用意するもの

* Wi-Fi回線
  * Armadilloをインターネットに接続するために必要です。
  * 有線接続を利用する場合は適宜設定を読み替えてください。
  * 実施会場において MQTTポート(1883/TCP) の解放確認が必要です。
* 作業用PC
  * Virtual Boxをインストールしておくこと。
* OMRON環境センサ(USB型)　形2JCIE-BU01
  * 必要に応じてUSB延長コードを用意すると便利でしょう。
* Armadillo-IoT G3
  * 付属の電源アダプタ、USB A-mini Bケーブルがあることを確認してください。
* SDカード
  * またはmicro SD + アダプタ　など
* ドキュメント類
  * [環境センサ USB型 ユーザーズマニュアル](https://omronfs.omron.com/ja_JP/ecb/products/pdf/CDSC-016A-web1.pdf)
  * [Armadillo-IoT ゲートウェイ G3 開発セット スタートアップガイド](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3document/armadillo-iotg-g3_startup_guide_ja-2.0.2.pdf)
  * [Armadillo-IoT ゲートウェイ G3 製品マニュアル](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3/document/armadillo-iotg-g3_product_manual_ja-2.1.0.pdf)

-----

## 作業用PC準備

作業用PCに開発環境をインストールします。詳細はArmadillo-IoT ゲートウェイ G3 製品マニュアル「4. Armadillo の電源を入れる前に」を参照してください。

1. Atmark TechnoのウェブサイトからVMWare仮想イメージファイルをダウンロードする。
    * [開発環境 ATDE7](https://users.atmark-techno.com/atde/atde-v7)
2. ダウンロードされたtar.xzファイルを解凍する
3. Virtual Boxからファイルを開き、開発環境が正常に起動することを確認する。

## 起動用SDカード作成

Armadilloの起動には、ハンズオンに必要な環境が事前にインストールされたSDカードを利用します。本項目では、この起動用SDカードの作成手順について説明します。詳細はArmadillo-IoT ゲートウェイ G3 製品マニュアル「15. SD ブートの活用」を参照してください。

1. 必要なファイルのダウンロード
    * リンクはすべてArmadillo-IoT G3を利用する場合のものです。それ以外のモデルを利用する場合はウェブサイトを参照してください。
    * リンクが切れている場合はより新しいバージョンがリリースされている可能性がありますのでウェブサイトを確認してください。
    * [ブートローダーイメージ](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3/image/u-boot-x1-at17.bin)
    * [ルートファイルシステム](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3/debian/debian-stretch-armhf_aiotg3_20190327.tar.gz)
    * [Linuxカーネル](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3/image/uImage-x1-v4.9-at6)
    * [DTBファイル](https://users.atmark-techno.com/files/downloads/armadillo-iot-g3/image/armadillo_iotg_g3-v4.9-at6.dtb)
1. ブートディスク作成
    * マニュアルに従い、Armadillo起動用のSDカードを作成します。
1. 必要なファイルの配置
    * マニュアルに従い、ルートファイルシステムの構築およびカーネル、DTBファイルの配置を行います。
1. Armadillo起動確認
    * Armadilloを開封し、JP1をショートに設定します。
    * フタを戻し、SDカードをスロットに挿入します。
    * ArmadilloをATDEにシリアル接続します。
        * 接続方法の詳細はマニュアルを確認してください。
    * 正常に起動できることを確認します。

### オプション

作成されたSDカードのイメージを保存しておくと、再度実施する際に上記の作業を省略できます。

-----

## Armadillo環境構築

起動ディスクが作成できたらハンズオン環境をArmadillo上に構築していきます。

### ネットワーク設定

Armadilloをネットワークに接続し、作業用PCからssh接続できるようにします。

1. シリアル接続によりArmadilloにrootでログインします。
    * 初期パスワードは`root`です。
2. `nmtui`を実行し、Wi-Fi接続を行います。
3. `ip a`を実行し、Wi-Fi接続が正常に行われていることを確認します。

    ```sh
    # ip a s dev wlan0
    3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
        link/ether 44:c3:06:30:c3:0f brd ff:ff:ff:ff:ff:ff
        inet 192.168.194.4/24 brd 192.168.194.255 scope global dynamic wlan0
           valid_lft 1192sec preferred_lft 1192sec
        inet6 fe80::46c3:6ff:fe30:c30f/64 scope link
           valid_lft forever preferred_lft forever
    ```

4. `ssh`をインストールします。
    * 2019年4月18日現在、aptより本体のほうが新しいモジュールが入っているケースがあるのでupgrade対象から除外しておきます。

      ```sh
      # apt update
      # echo atmark-x1-base hold | sudo dpkg --set-selections
      # apt upgrade -y
      # apt install ssh -y
      ```

5. セキュリティ確保のため、`root`がssh接続できないようにします。
    * 下記のテキストをコピー＆ペーストし、sshd_config.patchファイルを作成します。

      ```diff
      --- /etc/ssh/sshd_config        2019-03-01 16:19:28.000000000 +0000
      +++ sshd_config 2019-04-18 06:01:29.965408621 +0000
      @@ -29,7 +29,7 @@
       # Authentication:

       #LoginGraceTime 2m
      -#PermitRootLogin prohibit-password
      +PermitRootLogin no
       #StrictModes yes
       #MaxAuthTries 6
       #MaxSessions 10
      ```

    * patchコマンドでパッチを当てます。

      ```sh
      # patch /etc/ssh/sshd_config < sshd_config.patch
      ```

6. ユーザ`atmark`が`sudo`を実行できるようにします。

    ```sh
    # usermod -aG sudo atmark
    ```

7. ログアウトし、シリアル接続を解除します。

### 環境構築

Armadillo上に必要な環境を構築していきます。これ以降の作業は作業用PCからArmadilloに対してSSH接続し、ユーザ`atmark`でログインして実施します。

1. node.jsインストール
    * ハンズオンでは`node.js` v8系列（LTS=Carbon）を使用します。

    ```sh
    $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    $ sudo apt-get install nodejs npm
    $ node -v
        v8.16.0
    $ npm -v
        6.4.1
    ```

1. ライブラリインストール
    * node.jsからBLEを使うためのライブラリをインストールします。

    ```sh
    $ sudo apt-get install bluetooth libbluetooth-dev libudev-dev -y
    ```

1. アプリケーションインストール
    * ハンズオンの実施に必要なツール類をインストールします。

        ```sh
        $ sudo apt install vim git
        ```

### 動作確認

Armadillo上で正常にBLE機能が動作していること、およびOMRON環境センサが動作していることを確認します。

1. ユーザ`atmark`でArmadilloにSSH接続する
1. ONROM環境センサをUSB電源に接続する
1. ArmadilloからBLEコンソールに接続する

    ```sh
    $ sudo bluetoothctl
    [NEW] Controller 44:C3:06:30:C3:0E armadillo [default]
    ```

1. BLEモジュールの電源をONにする

    ```sh
    [bluetooth]# power on
    Changing power on succeeded
    ```

1. BLEデバイスをスキャンする
    * `Rbt`で終わる行が表示されたらOMRON環境センサが正常に検出されています。

    ```sh
   [bluetooth]# scan on
    Discovery started
    [NEW] Device DD:FD:65:B0:CF:92 Rbt
    [bluetooth]# scan off
    ```

### ハンズオンコンテンツ導入

1. githubリポジトリからコンテンツをダウンロードします。

    ```sh
    $ git clone https://github.com/greennote-inc/omron-handson.git
    ```

1. ハンズオンに必要なパッケージをインストールします。

    ```sh
    $ cd omron-handson/Armadillo

    // ハンズオン受講者のみが使う場合はこちらを実行
    $ npm update

    // ハンズオン開発用に使う場合はこちらを実行
    $ npm update --save-dev
    ```

    * 2019年4月現在、上記コマンドを実行すると下記のようなセキュリティ警告が出ます。nobleパッケージが利用しているdebugパッケージの脆弱性によるものです。ハンズオンの実施には影響ありませんので無視して構いませんが、本番利用を考える場合は利用者の責任において検討してください。詳細が知りたい方は`$ npm audit`を実行してください。

        ```text
        found 2 low severity vulnerabilities
        run `npm audit fix` to fix them, or `npm audit` for details
        ```

* [TODO]作業内容を書く。
* [TODO]dps-keygenのインストール
